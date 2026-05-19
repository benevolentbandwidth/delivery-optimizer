#pragma once

#include "deliveryoptimizer/api/optimize_request.hpp"

#include <cstddef>
#include <json/json.h>
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

struct WeatherImpactEstimate {
  int stop_count{0};
  int baseline_duration_seconds{0};
  int weather_delay_seconds{0};
  int reoptimize_threshold_seconds{300};
  bool should_reoptimize{false};
};

[[nodiscard]] WeatherForecastOptions ResolveWeatherForecastOptionsFromEnv();

[[nodiscard]] bool IsOpenWeatherConfigured(const WeatherForecastOptions& options);

[[nodiscard]] WeatherImpactEstimate EstimateWeatherImpact(const WeatherForecastOptions& options,
                                                          std::size_t stop_count,
                                                          int baseline_duration_seconds);

[[nodiscard]] Json::Value BuildWeatherAdjustedVroomInput(const OptimizeRequestInput& input,
                                                         const WeatherForecastOptions& options,
                                                         int baseline_duration_seconds);

[[nodiscard]] Json::Value BuildWeatherForecastAnnotation(const WeatherForecastOptions& options,
                                                         const WeatherImpactEstimate& impact);

} // namespace deliveryoptimizer::api
