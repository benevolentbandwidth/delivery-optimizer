#pragma once

#include "deliveryoptimizer/api/optimize_request.hpp"

#include <chrono>
#include <cstddef>
#include <json/json.h>
#include <optional>
#include <string>

namespace deliveryoptimizer::api {

struct WeatherForecastOptions {
  bool enabled{false};
  int weather_delay_seconds_per_stop{0};
  int reoptimize_threshold_seconds{300};
  double reoptimize_threshold_percent{5.0};
  std::string openweather_api_key;
  std::string openweather_base_url;
};

struct OpenWeatherDelayEstimate {
  bool available{false};
  int delay_seconds_per_stop{0};
  std::string source;
};

struct WeatherImpactEstimate {
  int stop_count{0};
  int baseline_duration_seconds{0};
  int baseline_route_duration_seconds{0};
  int delay_seconds_per_stop{0};
  int weather_delay_seconds{0};
  int weather_adjusted_duration_seconds{0};
  int reoptimize_threshold_seconds{300};
  bool should_reoptimize{false};
  std::string source;
  std::optional<std::chrono::sys_seconds> planned_start_time;
  std::optional<std::chrono::sys_seconds> estimated_finish_time;
};

[[nodiscard]] WeatherForecastOptions ResolveWeatherForecastOptionsFromEnv();

[[nodiscard]] bool IsOpenWeatherConfigured(const WeatherForecastOptions& options);

[[nodiscard]] int EstimateServiceSeconds(const OptimizeRequestInput& input);

[[nodiscard]] OpenWeatherDelayEstimate FetchOpenWeatherDelayEstimate(
    const WeatherForecastOptions& options, const Coordinate& coordinate,
    std::optional<std::chrono::sys_seconds> route_start_time = std::nullopt,
    std::optional<int> route_duration_seconds = std::nullopt);

[[nodiscard]] int
ReadOpenWeatherDelay(const Json::Value& body,
                     std::optional<std::chrono::sys_seconds> route_start_time = std::nullopt,
                     std::optional<int> route_duration_seconds = std::nullopt);

[[nodiscard]] WeatherImpactEstimate EstimateWeatherImpact(const WeatherForecastOptions& options,
                                                          std::size_t stop_count,
                                                          int baseline_duration_seconds);

[[nodiscard]] WeatherImpactEstimate
EstimateRouteWeatherImpact(const WeatherForecastOptions& options, const OptimizeRequestInput& input,
                           int baseline_duration_seconds);

[[nodiscard]] std::optional<std::chrono::sys_seconds>
ReadRouteStartTime(const OptimizeRequestInput& input);

[[nodiscard]] std::optional<int> ReadVroomDuration(const Json::Value& vroom_output);

[[nodiscard]] WeatherImpactEstimate RecalculateWeatherImpact(const WeatherForecastOptions& options,
                                                             const OptimizeRequestInput& input,
                                                             const Json::Value& vroom_output);

[[nodiscard]] std::string BuildWeatherAdjustedVroomInputText(const OptimizeRequestInput& input,
                                                             const WeatherImpactEstimate& impact);

[[nodiscard]] Json::Value BuildWeatherForecastAnnotation(const WeatherForecastOptions& options,
                                                         const WeatherImpactEstimate& impact);

} // namespace deliveryoptimizer::api
