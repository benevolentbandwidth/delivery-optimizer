#include "deliveryoptimizer/adapters/json_utils.hpp"
#include "deliveryoptimizer/api/forecast_optimizer.hpp"

#include <gtest/gtest.h>
#include <json/json.h>
#include <optional>

namespace {

[[nodiscard]] Json::Value ParsePayloadText(const std::string& payload_text) {
  const auto payload = deliveryoptimizer::adapters::ParseJsonText(payload_text);
  EXPECT_TRUE(payload.has_value());
  return payload.value_or(Json::Value{Json::objectValue});
}

[[nodiscard]] deliveryoptimizer::api::OptimizeRequestInput BuildInput() {
  return deliveryoptimizer::api::OptimizeRequestInput{
      .depot_lon = -121.7405,
      .depot_lat = 38.5449,
      .vehicles =
          {
              deliveryoptimizer::api::VehicleInput{
                  .external_id = "driver-1",
                  .capacity = 8,
                  .start = std::nullopt,
                  .end = std::nullopt,
                  .time_window = std::nullopt,
              },
          },
      .jobs =
          {
              deliveryoptimizer::api::JobInput{
                  .external_id = "stop-1",
                  .lon = -121.748,
                  .lat = 38.545,
                  .demand = 1,
                  .service = 180,
                  .time_windows = std::nullopt,
              },
              deliveryoptimizer::api::JobInput{
                  .external_id = "stop-2",
                  .lon = -121.752,
                  .lat = 38.548,
                  .demand = 1,
                  .service = 120,
                  .time_windows = std::nullopt,
              },
          },
  };
}

[[nodiscard]] Json::Value BuildWeatherHour(const int dt, const int condition_id) {
  Json::Value hour{Json::objectValue};
  hour["dt"] = dt;
  hour["wind_speed"] = 0.0;
  hour["visibility"] = 10000;

  Json::Value condition{Json::objectValue};
  condition["id"] = condition_id;
  hour["weather"] = Json::Value{Json::arrayValue};
  hour["weather"].append(condition);
  return hour;
}

[[nodiscard]] Json::Value BuildRainyThunderHour() {
  Json::Value hour = BuildWeatherHour(0, 201);
  hour["rain"] = Json::Value{Json::objectValue};
  hour["rain"]["1h"] = 2.0;
  return hour;
}

} // namespace

TEST(WeatherForecastOptimizerTest, DisabledWeatherHasNoImpact) {
  const deliveryoptimizer::api::WeatherForecastOptions options{
      .enabled = false,
      .weather_delay_seconds_per_stop = 200,
      .reoptimize_threshold_seconds = 100,
      .reoptimize_threshold_percent = 0.0,
      .openweather_api_key = "",
      .openweather_base_url = "",
  };

  const deliveryoptimizer::api::WeatherImpactEstimate impact =
      deliveryoptimizer::api::EstimateWeatherImpact(options, 2U, 300);

  EXPECT_EQ(impact.weather_delay_seconds, 0);
  EXPECT_FALSE(impact.should_reoptimize);
}

TEST(WeatherForecastOptimizerTest, BelowThresholdWeatherDoesNotChangeVroomInput) {
  const auto input = BuildInput();
  const deliveryoptimizer::api::WeatherForecastOptions options{
      .enabled = true,
      .weather_delay_seconds_per_stop = 30,
      .reoptimize_threshold_seconds = 300,
      .reoptimize_threshold_percent = 0.0,
      .openweather_api_key = "",
      .openweather_base_url = "",
  };

  const Json::Value payload =
      ParsePayloadText(deliveryoptimizer::api::BuildWeatherAdjustedVroomInputText(
          input, deliveryoptimizer::api::EstimateWeatherImpact(options, input.jobs.size(), 300)));

  ASSERT_TRUE(payload["jobs"].isArray());
  ASSERT_EQ(payload["jobs"].size(), 2U);
  EXPECT_EQ(payload["jobs"][0]["service"].asInt(), 180);
  EXPECT_EQ(payload["jobs"][1]["service"].asInt(), 120);
}

TEST(WeatherForecastOptimizerTest, AboveThresholdWeatherAddsServiceTime) {
  const auto input = BuildInput();
  const deliveryoptimizer::api::WeatherForecastOptions options{
      .enabled = true,
      .weather_delay_seconds_per_stop = 200,
      .reoptimize_threshold_seconds = 100,
      .reoptimize_threshold_percent = 0.0,
      .openweather_api_key = "",
      .openweather_base_url = "",
  };

  const deliveryoptimizer::api::WeatherImpactEstimate impact =
      deliveryoptimizer::api::EstimateWeatherImpact(options, input.jobs.size(), 300);
  const Json::Value payload =
      ParsePayloadText(deliveryoptimizer::api::BuildWeatherAdjustedVroomInputText(input, impact));
  const Json::Value forecast =
      deliveryoptimizer::api::BuildWeatherForecastAnnotation(options, impact);

  ASSERT_TRUE(payload["jobs"].isArray());
  ASSERT_EQ(payload["jobs"].size(), 2U);
  EXPECT_EQ(payload["jobs"][0]["service"].asInt(), 380);
  EXPECT_EQ(payload["jobs"][1]["service"].asInt(), 320);
  EXPECT_EQ(forecast["weather_delay_seconds"].asInt(), 400);
  EXPECT_TRUE(forecast["reoptimization"]["applied"].asBool());
}
TEST(WeatherForecastOptimizerTest, ReadsVroomSummaryDuration) {
  Json::Value output{Json::objectValue};
  output["summary"] = Json::Value{Json::objectValue};
  output["summary"]["duration"] = 124.2;

  const std::optional<int> duration = deliveryoptimizer::api::ReadVroomDuration(output);

  ASSERT_TRUE(duration.has_value());
  EXPECT_EQ(*duration, 125);
}

TEST(WeatherForecastOptimizerTest, IgnoresMissingVroomSummaryDuration) {
  const Json::Value output{Json::objectValue};

  EXPECT_FALSE(deliveryoptimizer::api::ReadVroomDuration(output).has_value());
}

TEST(WeatherForecastOptimizerTest, ReadsEarliestVehicleStartTime) {
  auto input = BuildInput();
  input.vehicles.push_back(deliveryoptimizer::api::VehicleInput{
      .external_id = "driver-2",
      .capacity = 8,
      .start = std::nullopt,
      .end = std::nullopt,
      .time_window =
          deliveryoptimizer::api::TimeWindow{
              .start = std::chrono::sys_seconds{std::chrono::seconds{1800}},
              .end = std::chrono::sys_seconds{std::chrono::seconds{7200}},
          },
  });
  input.vehicles[0].time_window = deliveryoptimizer::api::TimeWindow{
      .start = std::chrono::sys_seconds{std::chrono::seconds{900}},
      .end = std::chrono::sys_seconds{std::chrono::seconds{3600}},
  };

  const std::optional<std::chrono::sys_seconds> planned_start =
      deliveryoptimizer::api::ReadRouteStartTime(input);

  ASSERT_TRUE(planned_start.has_value());
  EXPECT_EQ(planned_start->time_since_epoch(), std::chrono::seconds{900});
}

TEST(WeatherForecastOptimizerTest, MissingVehicleTimeWindowHasNoPlannedStart) {
  const auto input = BuildInput();

  EXPECT_FALSE(deliveryoptimizer::api::ReadRouteStartTime(input).has_value());
}

TEST(WeatherForecastOptimizerTest, ReadsOpenWeatherHourNearRouteStart) {
  Json::Value body{Json::objectValue};
  body["hourly"] = Json::Value{Json::arrayValue};
  body["hourly"].append(BuildWeatherHour(0, 201));
  body["hourly"].append(BuildWeatherHour(7200, 800));
  body["hourly"].append(BuildWeatherHour(10800, 201));

  const int delay = deliveryoptimizer::api::ReadOpenWeatherDelay(
      body, std::chrono::sys_seconds{std::chrono::seconds{7200}}, 1800);

  EXPECT_EQ(delay, 0);
}

TEST(WeatherForecastOptimizerTest, ReadsBadOpenWeatherHourNearRouteStart) {
  Json::Value body{Json::objectValue};
  body["hourly"] = Json::Value{Json::arrayValue};
  body["hourly"].append(BuildWeatherHour(0, 800));
  body["hourly"].append(BuildWeatherHour(7200, 201));

  const int delay = deliveryoptimizer::api::ReadOpenWeatherDelay(
      body, std::chrono::sys_seconds{std::chrono::seconds{7200}}, 1800);

  EXPECT_EQ(delay, 240);
}

TEST(WeatherForecastOptimizerTest, ThunderDoesNotAlsoChargeRainDelay) {
  Json::Value body{Json::objectValue};
  body["hourly"] = Json::Value{Json::arrayValue};
  body["hourly"].append(BuildRainyThunderHour());

  const int delay = deliveryoptimizer::api::ReadOpenWeatherDelay(body);

  EXPECT_EQ(delay, 240);
}

TEST(WeatherForecastOptimizerTest, RefinesForecastWithVroomSummaryDuration) {
  auto input = BuildInput();
  input.vehicles[0].time_window = deliveryoptimizer::api::TimeWindow{
      .start = std::chrono::sys_seconds{std::chrono::seconds{600}},
      .end = std::chrono::sys_seconds{std::chrono::seconds{3600}},
  };
  const deliveryoptimizer::api::WeatherForecastOptions options{
      .enabled = true,
      .weather_delay_seconds_per_stop = 200,
      .reoptimize_threshold_seconds = 100,
      .reoptimize_threshold_percent = 0.0,
      .openweather_api_key = "",
      .openweather_base_url = "",
  };
  Json::Value output{Json::objectValue};
  output["summary"] = Json::Value{Json::objectValue};
  output["summary"]["duration"] = 960;

  const deliveryoptimizer::api::WeatherImpactEstimate impact =
      deliveryoptimizer::api::RecalculateWeatherImpact(options, input, output);
  const Json::Value forecast =
      deliveryoptimizer::api::BuildWeatherForecastAnnotation(options, impact);

  EXPECT_FALSE(forecast.isMember("baseline_duration_seconds"));
  EXPECT_EQ(forecast["baseline_route_duration_seconds"].asInt(), 960);
  EXPECT_EQ(forecast["weather_delay_seconds"].asInt(), 400);
  EXPECT_EQ(forecast["weather_adjusted_duration_seconds"].asInt(), 1360);
  EXPECT_FALSE(forecast.isMember("predicted_duration_seconds"));
  EXPECT_EQ(forecast["planned_start_time"].asInt64(), 600);
  EXPECT_EQ(forecast["estimated_finish_time"].asInt64(), 1960);
}

TEST(TrafficForecastOptimizerTest, DisabledTrafficHasNoImpact) {
  const deliveryoptimizer::api::TrafficForecastOptions options{
      .enabled = false,
      .reoptimize_threshold_seconds = 100,
      .reoptimize_threshold_percent = 0.0,
      .google_maps_api_key = "",
      .google_maps_base_url = "",
  };

  const deliveryoptimizer::api::TrafficImpact impact =
      deliveryoptimizer::api::EstimateTrafficImpact(options, 900, 300, "google_maps");

  EXPECT_EQ(impact.traffic_delay_seconds, 0);
  EXPECT_FALSE(impact.should_reoptimize);
  EXPECT_EQ(impact.source, "disabled");
}

TEST(TrafficForecastOptimizerTest, BelowThresholdTrafficDoesNotReoptimize) {
  const deliveryoptimizer::api::TrafficForecastOptions options{
      .enabled = true,
      .reoptimize_threshold_seconds = 300,
      .reoptimize_threshold_percent = 0.0,
      .google_maps_api_key = "",
      .google_maps_base_url = "",
  };

  const deliveryoptimizer::api::TrafficImpact impact =
      deliveryoptimizer::api::EstimateTrafficImpact(options, 900, 120, "google_maps");

  EXPECT_EQ(impact.traffic_delay_seconds, 120);
  EXPECT_EQ(impact.traffic_adjusted_duration_seconds, 1020);
  EXPECT_FALSE(impact.should_reoptimize);
}

TEST(TrafficForecastOptimizerTest, AboveThresholdTrafficReoptimizes) {
  const deliveryoptimizer::api::TrafficForecastOptions options{
      .enabled = true,
      .reoptimize_threshold_seconds = 100,
      .reoptimize_threshold_percent = 0.0,
      .google_maps_api_key = "",
      .google_maps_base_url = "",
  };

  const deliveryoptimizer::api::TrafficImpact impact =
      deliveryoptimizer::api::EstimateTrafficImpact(options, 900, 180, "google_maps");

  EXPECT_EQ(impact.traffic_delay_seconds, 180);
  EXPECT_TRUE(impact.should_reoptimize);
}
