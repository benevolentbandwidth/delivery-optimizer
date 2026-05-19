#include "deliveryoptimizer/api/forecast_optimizer.hpp"

#include "deliveryoptimizer/api/optimize_request.hpp"

#include <algorithm>
#include <charconv>
#include <cmath>
#include <cstddef>
#include <cstdlib>
#include <limits>
#include <optional>
#include <string_view>

namespace {

constexpr std::string_view kWeatherEnabledEnv = "DELIVERYOPTIMIZER_WEATHER_FORECAST_ENABLED";
constexpr std::string_view kWeatherDelayPerStopEnv =
    "DELIVERYOPTIMIZER_WEATHER_DELAY_SECONDS_PER_STOP";
constexpr std::string_view kWeatherThresholdSecondsEnv =
    "DELIVERYOPTIMIZER_WEATHER_REOPTIMIZE_THRESHOLD_SECONDS";
constexpr std::string_view kWeatherThresholdPercentEnv =
    "DELIVERYOPTIMIZER_WEATHER_REOPTIMIZE_THRESHOLD_PERCENT";
constexpr int kDefaultWeatherThresholdSeconds = 300;
constexpr double kDefaultWeatherThresholdPercent = 5.0;

[[nodiscard]] bool IsEnabledFlag(const char* raw_value) {
  if (raw_value == nullptr || *raw_value == '\0') {
    return false;
  }

  const std::string_view value{raw_value};
  return value == "1" || value == "true" || value == "TRUE" || value == "yes" ||
         value == "YES";
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

[[nodiscard]] int ClampToInt(const long long value) {
  if (value > static_cast<long long>(std::numeric_limits<int>::max())) {
    return std::numeric_limits<int>::max();
  }

  return static_cast<int>(value);
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
  };
}

WeatherImpactEstimate EstimateWeatherImpact(const WeatherForecastOptions& options,
                                             const std::size_t stop_count,
                                             const int baseline_duration_seconds) {
  const int normalized_stop_count =
      ClampToInt(static_cast<long long>(std::min<std::size_t>(
          stop_count, static_cast<std::size_t>(std::numeric_limits<int>::max()))));
  const int normalized_baseline_seconds = std::max(baseline_duration_seconds, 0);
  const int configured_delay_per_stop =
      options.enabled ? std::max(options.weather_delay_seconds_per_stop, 0) : 0;
  const int weather_delay_seconds =
      ClampToInt(static_cast<long long>(configured_delay_per_stop) * normalized_stop_count);
  const int percent_threshold_seconds = ClampToInt(static_cast<long long>(std::ceil(
      static_cast<double>(normalized_baseline_seconds) *
      (std::max(options.reoptimize_threshold_percent, 0.0) / 100.0))));
  const int threshold_seconds =
      std::max(std::max(options.reoptimize_threshold_seconds, 0), percent_threshold_seconds);

  return WeatherImpactEstimate{
      .stop_count = normalized_stop_count,
      .baseline_duration_seconds = normalized_baseline_seconds,
      .weather_delay_seconds = weather_delay_seconds,
      .reoptimize_threshold_seconds = threshold_seconds,
      .should_reoptimize = weather_delay_seconds > 0 && weather_delay_seconds >= threshold_seconds,
  };
}

Json::Value BuildWeatherAdjustedVroomInput(const OptimizeRequestInput& input,
                                           const WeatherForecastOptions& options,
                                           const int baseline_duration_seconds) {
  Json::Value payload = BuildVroomInput(input);
  const WeatherImpactEstimate impact =
      EstimateWeatherImpact(options, input.jobs.size(), baseline_duration_seconds);
  if (!impact.should_reoptimize) {
    return payload;
  }

  // Weather delay time so VROOM can still decide the route order before dispatch.
  for (Json::ArrayIndex index = 0; index < payload["jobs"].size(); ++index) {
    Json::Value& job = payload["jobs"][index];
    const int current_service = job["service"].isInt() ? job["service"].asInt() : 0;
    job["service"] = current_service + options.weather_delay_seconds_per_stop;
  }

  return payload;
}

} // namespace deliveryoptimizer::api
