#pragma once

namespace deliveryoptimizer::api {

struct WeatherForecastOptions {
  bool enabled{false};
  int weather_delay_seconds_per_stop{0};
  int reoptimize_threshold_seconds{300};
  double reoptimize_threshold_percent{5.0};
};

[[nodiscard]] WeatherForecastOptions ResolveWeatherForecastOptionsFromEnv();

} // namespace deliveryoptimizer::api
