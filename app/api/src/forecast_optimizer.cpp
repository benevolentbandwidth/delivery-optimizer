#include "deliveryoptimizer/api/forecast_optimizer.hpp"

#include "deliveryoptimizer/api/optimize_request.hpp"

#include <algorithm>
#include <charconv>
#include <chrono>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <drogon/drogon.h>
#include <future>
#include <iomanip>
#include <limits>
#include <memory>
#include <optional>
#include <sstream>
#include <string>
#include <string_view>
#include <utility>

namespace {

constexpr std::string_view kWeatherEnabledEnv = "DELIVERYOPTIMIZER_WEATHER_FORECAST_ENABLED";
constexpr std::string_view kWeatherDelayPerStopEnv =
    "DELIVERYOPTIMIZER_WEATHER_DELAY_SECONDS_PER_STOP";
constexpr std::string_view kWeatherThresholdSecondsEnv =
    "DELIVERYOPTIMIZER_WEATHER_REOPTIMIZE_THRESHOLD_SECONDS";
constexpr std::string_view kWeatherThresholdPercentEnv =
    "DELIVERYOPTIMIZER_WEATHER_REOPTIMIZE_THRESHOLD_PERCENT";
constexpr std::string_view kOpenWeatherApiKeyEnv = "OPENWEATHER_API_KEY";
constexpr std::string_view kOpenWeatherBaseUrlEnv = "OPENWEATHER_BASE_URL";
constexpr std::string_view kDefaultOpenWeatherBaseUrl = "https://api.openweathermap.org";
constexpr std::string_view kTrafficEnabledEnv = "DELIVERYOPTIMIZER_TRAFFIC_FORECAST_ENABLED";
constexpr std::string_view kTrafficThresholdSecondsEnv =
    "DELIVERYOPTIMIZER_TRAFFIC_REOPTIMIZE_THRESHOLD_SECONDS";
constexpr std::string_view kTrafficThresholdPercentEnv =
    "DELIVERYOPTIMIZER_TRAFFIC_REOPTIMIZE_THRESHOLD_PERCENT";
constexpr std::string_view kGoogleMapsApiKeyEnv = "GOOGLE_MAPS_API_KEY";
constexpr std::string_view kGoogleMapsBaseUrlEnv = "GOOGLE_MAPS_BASE_URL";
constexpr std::string_view kDefaultGoogleMapsBaseUrl = "https://maps.googleapis.com";
constexpr int kOpenWeatherTimeoutSeconds = 4;
constexpr int kDefaultWeatherThresholdSeconds = 300;
constexpr double kDefaultWeatherThresholdPercent = 5.0;
constexpr int kDefaultTrafficThresholdSeconds = 300;
constexpr double kDefaultTrafficThresholdPercent = 5.0;

[[nodiscard]] bool IsEnabledFlag(const char* raw_value) {
  if (raw_value == nullptr || *raw_value == '\0') {
    return false;
  }

  const std::string_view value{raw_value};
  return value == "1" || value == "true" || value == "TRUE" || value == "yes" || value == "YES";
}

[[nodiscard]] std::optional<int> ParseNonNegativeInt(const char* raw_value) {
  if (raw_value == nullptr || *raw_value == '\0') {
    return std::nullopt;
  }

  const std::string_view text{raw_value};
  int parsed_value = 0;
  const auto [end_ptr, error] =
      std::from_chars(text.data(), text.data() + text.size(), parsed_value);
  if (error != std::errc{} || end_ptr != text.data() + text.size() || parsed_value < 0) {
    return std::nullopt;
  }

  return parsed_value;
}

[[nodiscard]] std::optional<double> ParseNonNegativeDouble(const char* raw_value) {
  if (raw_value == nullptr || *raw_value == '\0') {
    return std::nullopt;
  }

  char* end_ptr = nullptr;
  const double parsed_value = std::strtod(raw_value, &end_ptr);
  if (end_ptr == raw_value || *end_ptr != '\0' || parsed_value < 0.0) {
    return std::nullopt;
  }

  return parsed_value;
}

[[nodiscard]] std::string ResolveStringEnvOrDefault(const char* key,
                                                    const std::string_view fallback) {
  const char* raw_value = std::getenv(key);
  if (raw_value == nullptr || *raw_value == '\0') {
    return std::string{fallback};
  }

  return std::string{raw_value};
}

[[nodiscard]] int ClampToInt(const long long value) {
  if (value > static_cast<long long>(std::numeric_limits<int>::max())) {
    return std::numeric_limits<int>::max();
  }

  return static_cast<int>(value);
}

[[nodiscard]] std::string FormatCoordinate(const double value) {
  std::ostringstream stream;
  stream << std::fixed << std::setprecision(6) << value;
  return stream.str();
}

[[nodiscard]] std::string BuildOpenWeatherPath(const deliveryoptimizer::api::Coordinate& coordinate,
                                               const std::string& api_key) {
  return "/data/3.0/onecall?lat=" + FormatCoordinate(coordinate.lat) +
         "&lon=" + FormatCoordinate(coordinate.lon) +
         "&exclude=current,minutely,daily,alerts&units=metric&appid=" + api_key;
}

[[nodiscard]] int DelayFromHourlyForecast(const Json::Value& hour) {
  int delay_seconds = 0;
  const double wind_speed = hour["wind_speed"].isNumeric() ? hour["wind_speed"].asDouble() : 0.0;
  const int visibility = hour["visibility"].isInt() ? hour["visibility"].asInt() : 10000;
  bool has_thunder = false;
  const Json::Value& weather = hour["weather"];
  if (weather.isArray()) {
    for (const Json::Value& condition : weather) {
      const int condition_id = condition["id"].isInt() ? condition["id"].asInt() : 0;
      if (condition_id >= 200 && condition_id < 300) {
        has_thunder = true;
      }
    }
  }

  if (wind_speed >= 10.0) {
    delay_seconds += 60;
  }
  if (visibility < 5000) {
    delay_seconds += 60;
  }
  if (has_thunder) {
    delay_seconds += 240;
  } else if (hour["rain"].isObject()) {
    delay_seconds += 90;
  }
  if (hour["snow"].isObject()) {
    delay_seconds += 180;
  }

  return delay_seconds;
}

[[nodiscard]] bool IsRouteHour(const Json::Value& hour,
                               const std::chrono::sys_seconds route_start_time,
                               const std::optional<int> route_duration_seconds) {
  if (!hour["dt"].isInt64() && !hour["dt"].isUInt64()) {
    return false;
  }

  const auto forecast_time =
      std::chrono::sys_seconds{std::chrono::seconds{hour["dt"].asLargestInt()}};
  const int window_seconds = std::max(route_duration_seconds.value_or(6 * 60 * 60), 60 * 60);
  return forecast_time >= route_start_time &&
         forecast_time < route_start_time + std::chrono::seconds{window_seconds};
}

void SetRouteTimes(const std::optional<std::chrono::sys_seconds> planned_start_time,
                   deliveryoptimizer::api::WeatherImpactEstimate& impact) {
  impact.planned_start_time = planned_start_time;
  if (!impact.planned_start_time.has_value()) {
    impact.estimated_finish_time = std::nullopt;
    return;
  }

  impact.estimated_finish_time =
      *impact.planned_start_time + std::chrono::seconds{impact.weather_adjusted_duration_seconds};
}

} // namespace

namespace deliveryoptimizer::api {

WeatherForecastOptions ResolveWeatherForecastOptionsFromEnv() {
  return WeatherForecastOptions{
      .enabled = IsEnabledFlag(std::getenv(kWeatherEnabledEnv.data())),
      .weather_delay_seconds_per_stop =
          ParseNonNegativeInt(std::getenv(kWeatherDelayPerStopEnv.data())).value_or(0),
      .reoptimize_threshold_seconds =
          ParseNonNegativeInt(std::getenv(kWeatherThresholdSecondsEnv.data()))
              .value_or(kDefaultWeatherThresholdSeconds),
      .reoptimize_threshold_percent =
          ParseNonNegativeDouble(std::getenv(kWeatherThresholdPercentEnv.data()))
              .value_or(kDefaultWeatherThresholdPercent),
      .openweather_api_key = ResolveStringEnvOrDefault(kOpenWeatherApiKeyEnv.data(), ""),
      .openweather_base_url =
          ResolveStringEnvOrDefault(kOpenWeatherBaseUrlEnv.data(), kDefaultOpenWeatherBaseUrl),
  };
}

TrafficForecastOptions ResolveTrafficForecastOptionsFromEnv() {
  return TrafficForecastOptions{
      .enabled = IsEnabledFlag(std::getenv(kTrafficEnabledEnv.data())),
      .reoptimize_threshold_seconds =
          ParseNonNegativeInt(std::getenv(kTrafficThresholdSecondsEnv.data()))
              .value_or(kDefaultTrafficThresholdSeconds),
      .reoptimize_threshold_percent =
          ParseNonNegativeDouble(std::getenv(kTrafficThresholdPercentEnv.data()))
              .value_or(kDefaultTrafficThresholdPercent),
      .google_maps_api_key = ResolveStringEnvOrDefault(kGoogleMapsApiKeyEnv.data(), ""),
      .google_maps_base_url =
          ResolveStringEnvOrDefault(kGoogleMapsBaseUrlEnv.data(), kDefaultGoogleMapsBaseUrl),
  };
}

bool IsOpenWeatherConfigured(const WeatherForecastOptions& options) {
  return options.enabled && !options.openweather_api_key.empty();
}

int EstimateServiceSeconds(const OptimizeRequestInput& input) {
  std::int64_t total = 0;
  for (const auto& job : input.jobs) {
    total += job.service;
    if (total >= std::numeric_limits<int>::max()) {
      return std::numeric_limits<int>::max();
    }
  }

  return static_cast<int>(total);
}

OpenWeatherDelayEstimate
FetchOpenWeatherDelayEstimate(const WeatherForecastOptions& options, const Coordinate& coordinate,
                              const std::optional<std::chrono::sys_seconds> route_start_time,
                              const std::optional<int> route_duration_seconds) {
  if (!IsOpenWeatherConfigured(options)) {
    return OpenWeatherDelayEstimate{
        .available = false,
        .delay_seconds_per_stop = 0,
        .source = "",
    };
  }

  auto client = drogon::HttpClient::newHttpClient(options.openweather_base_url);
  auto request = drogon::HttpRequest::newHttpRequest();
  request->setMethod(drogon::Get);
  request->setPath(BuildOpenWeatherPath(coordinate, options.openweather_api_key));

  auto promise = std::make_shared<std::promise<OpenWeatherDelayEstimate>>();
  auto future = promise->get_future();
  client->sendRequest(
      request,
      [promise, route_start_time, route_duration_seconds](const drogon::ReqResult result,
                                                          const drogon::HttpResponsePtr& response) {
        if (result != drogon::ReqResult::Ok || response == nullptr ||
            response->getStatusCode() != drogon::k200OK) {
          promise->set_value(OpenWeatherDelayEstimate{
              .available = false,
              .delay_seconds_per_stop = 0,
              .source = "",
          });
          return;
        }

        const auto body = response->getJsonObject();
        if (body == nullptr) {
          promise->set_value(OpenWeatherDelayEstimate{
              .available = false,
              .delay_seconds_per_stop = 0,
              .source = "",
          });
          return;
        }

        promise->set_value(OpenWeatherDelayEstimate{
            .available = true,
            .delay_seconds_per_stop =
                ReadOpenWeatherDelay(*body, route_start_time, route_duration_seconds),
            .source = "openweather",
        });
      },
      kOpenWeatherTimeoutSeconds);

  if (future.wait_for(std::chrono::seconds{kOpenWeatherTimeoutSeconds + 1}) !=
      std::future_status::ready) {
    return OpenWeatherDelayEstimate{
        .available = false,
        .delay_seconds_per_stop = 0,
        .source = "",
    };
  }

  return future.get();
}

int ReadOpenWeatherDelay(const Json::Value& body,
                         const std::optional<std::chrono::sys_seconds> route_start_time,
                         const std::optional<int> route_duration_seconds) {
  const Json::Value& hourly = body["hourly"];
  if (!hourly.isArray()) {
    return 0;
  }

  if (!route_start_time.has_value()) {
    int fallback_delay_seconds = 0;
    const Json::ArrayIndex hours_to_scan = std::min<Json::ArrayIndex>(hourly.size(), 6U);
    for (Json::ArrayIndex index = 0U; index < hours_to_scan; ++index) {
      fallback_delay_seconds =
          std::max(fallback_delay_seconds, DelayFromHourlyForecast(hourly[index]));
    }
    return fallback_delay_seconds;
  }

  int delay_seconds = 0;
  Json::ArrayIndex matched_hours = 0U;
  for (Json::ArrayIndex index = 0U; index < hourly.size(); ++index) {
    if (!IsRouteHour(hourly[index], *route_start_time, route_duration_seconds)) {
      continue;
    }
    delay_seconds = std::max(delay_seconds, DelayFromHourlyForecast(hourly[index]));
    ++matched_hours;
  }

  if (matched_hours > 0U) {
    return delay_seconds;
  }

  const Json::ArrayIndex hours_to_scan = std::min<Json::ArrayIndex>(hourly.size(), 6U);
  for (Json::ArrayIndex index = 0U; index < hours_to_scan; ++index) {
    delay_seconds = std::max(delay_seconds, DelayFromHourlyForecast(hourly[index]));
  }

  return delay_seconds;
}

WeatherImpactEstimate EstimateWeatherImpact(const WeatherForecastOptions& options,
                                            const std::size_t stop_count,
                                            const int baseline_duration_seconds) {
  const int normalized_stop_count = ClampToInt(static_cast<long long>(std::min<std::size_t>(
      stop_count, static_cast<std::size_t>(std::numeric_limits<int>::max()))));
  const int normalized_baseline_seconds = std::max(baseline_duration_seconds, 0);
  const int configured_delay_per_stop =
      options.enabled ? std::max(options.weather_delay_seconds_per_stop, 0) : 0;
  const int weather_delay_seconds =
      ClampToInt(static_cast<long long>(configured_delay_per_stop) * normalized_stop_count);
  const int percent_threshold_seconds = ClampToInt(static_cast<long long>(
      std::ceil(static_cast<double>(normalized_baseline_seconds) *
                (std::max(options.reoptimize_threshold_percent, 0.0) / 100.0))));
  const int threshold_seconds =
      std::max(std::max(options.reoptimize_threshold_seconds, 0), percent_threshold_seconds);

  return WeatherImpactEstimate{
      .stop_count = normalized_stop_count,
      .baseline_duration_seconds = normalized_baseline_seconds,
      .baseline_route_duration_seconds = normalized_baseline_seconds,
      .delay_seconds_per_stop = configured_delay_per_stop,
      .weather_delay_seconds = weather_delay_seconds,
      .weather_adjusted_duration_seconds = normalized_baseline_seconds + weather_delay_seconds,
      .reoptimize_threshold_seconds = threshold_seconds,
      .should_reoptimize = weather_delay_seconds > 0 && weather_delay_seconds >= threshold_seconds,
      .source = options.enabled ? "fixed_delay" : "disabled",
      .planned_start_time = std::nullopt,
      .estimated_finish_time = std::nullopt,
  };
}

TrafficImpact EstimateTrafficImpact(const TrafficForecastOptions& options,
                                    const int baseline_duration_seconds,
                                    const int traffic_delay_seconds, std::string source) {
  const int normalized_baseline_seconds = std::max(baseline_duration_seconds, 0);
  const int normalized_delay_seconds = options.enabled ? std::max(traffic_delay_seconds, 0) : 0;
  const int percent_threshold_seconds = ClampToInt(static_cast<long long>(
      std::ceil(static_cast<double>(normalized_baseline_seconds) *
                (std::max(options.reoptimize_threshold_percent, 0.0) / 100.0))));
  const int threshold_seconds =
      std::max(std::max(options.reoptimize_threshold_seconds, 0), percent_threshold_seconds);

  return TrafficImpact{
      .baseline_duration_seconds = normalized_baseline_seconds,
      .traffic_delay_seconds = normalized_delay_seconds,
      .traffic_adjusted_duration_seconds = normalized_baseline_seconds + normalized_delay_seconds,
      .reoptimize_threshold_seconds = threshold_seconds,
      .should_reoptimize =
          normalized_delay_seconds > 0 && normalized_delay_seconds >= threshold_seconds,
      .source = options.enabled ? std::move(source) : "disabled",
  };
}

WeatherImpactEstimate EstimateRouteWeatherImpact(const WeatherForecastOptions& options,
                                                 const OptimizeRequestInput& input,
                                                 const int baseline_duration_seconds) {
  WeatherForecastOptions effective_options = options;
  WeatherImpactEstimate impact =
      EstimateWeatherImpact(effective_options, input.jobs.size(), baseline_duration_seconds);
  const std::optional<std::chrono::sys_seconds> route_start_time = ReadRouteStartTime(input);
  SetRouteTimes(route_start_time, impact);
  const OpenWeatherDelayEstimate openweather = FetchOpenWeatherDelayEstimate(
      effective_options, Coordinate{.lon = input.depot_lon, .lat = input.depot_lat},
      route_start_time, baseline_duration_seconds);
  if (openweather.available) {
    effective_options.weather_delay_seconds_per_stop = openweather.delay_seconds_per_stop;
    impact = EstimateWeatherImpact(effective_options, input.jobs.size(), baseline_duration_seconds);
    impact.source = openweather.source;
    SetRouteTimes(route_start_time, impact);
  }

  return impact;
}

std::optional<std::chrono::sys_seconds> ReadRouteStartTime(const OptimizeRequestInput& input) {
  std::optional<std::chrono::sys_seconds> planned_start;
  for (const VehicleInput& vehicle : input.vehicles) {
    if (!vehicle.time_window.has_value()) {
      continue;
    }
    if (!planned_start.has_value() || vehicle.time_window->start < *planned_start) {
      planned_start = vehicle.time_window->start;
    }
  }

  return planned_start;
}

std::optional<int> ReadVroomDuration(const Json::Value& vroom_output) {
  const Json::Value& duration = vroom_output["summary"]["duration"];
  if (!duration.isNumeric()) {
    return std::nullopt;
  }

  const double raw_duration = duration.asDouble();
  if (raw_duration < 0.0 || raw_duration > static_cast<double>(std::numeric_limits<int>::max())) {
    return std::nullopt;
  }

  return static_cast<int>(std::ceil(raw_duration));
}

WeatherImpactEstimate RecalculateWeatherImpact(const WeatherForecastOptions& options,
                                               const OptimizeRequestInput& input,
                                               const Json::Value& vroom_output) {
  // Callers choose whether OpenWeather may be queried by passing or clearing the API key.
  const std::optional<int> summary_duration = ReadVroomDuration(vroom_output);
  if (!summary_duration.has_value()) {
    return EstimateRouteWeatherImpact(options, input, 0);
  }

  return EstimateRouteWeatherImpact(options, input, *summary_duration);
}

Json::Value BuildWeatherAdjustedVroomInput(const OptimizeRequestInput& input,
                                           const WeatherImpactEstimate& impact) {
  Json::Value payload = BuildVroomInput(input);
  if (!impact.should_reoptimize) {
    return payload;
  }

  // Weather delay time so VROOM can still decide the route order before dispatch.
  for (Json::ArrayIndex index = 0; index < payload["jobs"].size(); ++index) {
    Json::Value& job = payload["jobs"][index];
    const int current_service = job["service"].isInt() ? job["service"].asInt() : 0;
    job["service"] = current_service + impact.delay_seconds_per_stop;
  }

  return payload;
}

Json::Value BuildWeatherForecastAnnotation(const WeatherForecastOptions& options,
                                           const WeatherImpactEstimate& impact) {
  Json::Value forecast{Json::objectValue};
  forecast["status"] = options.enabled ? "evaluated" : "disabled";
  forecast["provider"] = impact.source;
  forecast["stop_count"] = impact.stop_count;
  forecast["baseline_route_duration_seconds"] = impact.baseline_route_duration_seconds;
  forecast["weather_delay_seconds"] = impact.weather_delay_seconds;
  forecast["weather_adjusted_duration_seconds"] = impact.weather_adjusted_duration_seconds;
  forecast["reoptimize_threshold_seconds"] = impact.reoptimize_threshold_seconds;
  if (impact.planned_start_time.has_value()) {
    forecast["planned_start_time"] =
        static_cast<Json::Int64>(impact.planned_start_time->time_since_epoch().count());
  }
  if (impact.estimated_finish_time.has_value()) {
    forecast["estimated_finish_time"] =
        static_cast<Json::Int64>(impact.estimated_finish_time->time_since_epoch().count());
  }

  Json::Value reoptimization{Json::objectValue};
  reoptimization["applied"] = impact.should_reoptimize;
  reoptimization["reason"] = impact.should_reoptimize ? "weather_delay_crossed_threshold"
                                                      : "weather_delay_below_threshold";
  forecast["reoptimization"] = std::move(reoptimization);

  return forecast;
}

} // namespace deliveryoptimizer::api
