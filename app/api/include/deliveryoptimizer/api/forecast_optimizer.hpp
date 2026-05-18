#pragma once

#include <cstddef>

namespace deliveryoptimizer::api {

struct WeatherForecastOptions {
  bool enabled{false};
  int weather_delay_seconds_per_stop{0};
  int reoptimize_threshold_seconds{300};
  double reoptimize_threshold_percent{5.0};
};

struct WeatherImpactEstimate {
  int stop_count{0};
  int baseline_duration_seconds{0};
  int weather_delay_seconds{0};
  int reoptimize_threshold_seconds{300};
  bool should_reoptimize{false};
};

[[nodiscard]] WeatherForecastOptions ResolveWeatherForecastOptionsFromEnv();

[[nodiscard]] WeatherImpactEstimate EstimateWeatherImpact(const WeatherForecastOptions& options,
                                                          std::size_t stop_count,
                                                          int baseline_duration_seconds);

} // namespace deliveryoptimizer::api
