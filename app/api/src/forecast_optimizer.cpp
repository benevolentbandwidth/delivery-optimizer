#include "deliveryoptimizer/api/forecast_optimizer.hpp"

#include <charconv>
#include <cstdlib>
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

} // namespace deliveryoptimizer::api
