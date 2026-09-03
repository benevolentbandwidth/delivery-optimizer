#include "deliveryoptimizer/adapters/json_utils.hpp"
#include "deliveryoptimizer/api/optimize_request.hpp"

#include <gtest/gtest.h>
#include <json/json.h>
#include <limits>
#include <optional>
#include <string>

namespace {

[[nodiscard]] deliveryoptimizer::api::OptimizeRequestInput BuildInput() {
  return deliveryoptimizer::api::OptimizeRequestInput{
      .depot_lon = 7.4236,
      .depot_lat = 43.7384,
      .vehicles =
          {
              deliveryoptimizer::api::VehicleInput{
                  .external_id = "van-1",
                  .capacity = 8,
                  .start = std::nullopt,
                  .end = std::nullopt,
                  .time_window =
                      deliveryoptimizer::api::TimeWindow{
                          .start = std::chrono::sys_seconds{std::chrono::seconds{0}},
                          .end = std::chrono::sys_seconds{std::chrono::seconds{86400}},
                      },
              },
          },
      .jobs =
          {
              deliveryoptimizer::api::JobInput{
                  .external_id = "order-\"quoted\"\\path",
                  .lon = 7.4212,
                  .lat = 43.7308,
                  .demand = 3,
                  .service = 180,
                  .time_windows =
                      std::vector<deliveryoptimizer::api::TimeWindow>{
                          deliveryoptimizer::api::TimeWindow{
                              .start = std::chrono::sys_seconds{std::chrono::seconds{3600}},
                              .end = std::chrono::sys_seconds{std::chrono::seconds{7200}},
                          },
                          deliveryoptimizer::api::TimeWindow{
                              .start = std::chrono::sys_seconds{std::chrono::seconds{10800}},
                              .end = std::chrono::sys_seconds{std::chrono::seconds{14400}},
                          },
                      },
              },
              deliveryoptimizer::api::JobInput{
                  .external_id = "order-2",
                  .lon = 7.4261,
                  .lat = 43.7412,
                  .demand = 1,
                  .service = 120,
                  .time_windows = std::nullopt,
              },
          },
  };
}

[[nodiscard]] Json::Value BuildRequestJson() {
  const auto request = deliveryoptimizer::adapters::ParseJsonText(R"JSON({
    "depot": {"location": [7.4236, 43.7384]},
    "vehicles": [{"id": "van-1", "capacity": 8}],
    "jobs": [{"id": "order-1", "location": [7.4212, 43.7308]}]
  })JSON");
  return request.value();
}

} // namespace

TEST(OptimizeRequestTest, BuildVroomInputTextRoundTripsThroughJsonParser) {
  const auto input = BuildInput();
  const std::string payload_text = deliveryoptimizer::api::BuildVroomInputText(input);
  const auto payload = deliveryoptimizer::adapters::ParseJsonText(payload_text);

  ASSERT_TRUE(payload.has_value());
  ASSERT_TRUE((*payload)["jobs"].isArray());
  ASSERT_EQ((*payload)["jobs"].size(), 2U);
  ASSERT_TRUE((*payload)["vehicles"].isArray());
  ASSERT_EQ((*payload)["vehicles"].size(), 1U);

  const Json::Value& job = (*payload)["jobs"][0U];
  EXPECT_EQ(job["id"].asUInt64(), 1U);
  ASSERT_TRUE(job["location"].isArray());
  EXPECT_DOUBLE_EQ(job["location"][0U].asDouble(), 7.4212);
  EXPECT_DOUBLE_EQ(job["location"][1U].asDouble(), 43.7308);
  ASSERT_TRUE(job["amount"].isArray());
  EXPECT_EQ(job["amount"][0U].asInt(), 3);
  EXPECT_EQ(job["service"].asInt(), 180);
  // External ids with quotes and backslashes survive the renderer's escaping.
  EXPECT_EQ(job["description"].asString(), "order-\"quoted\"\\path");
  ASSERT_TRUE(job["time_windows"].isArray());
  ASSERT_EQ(job["time_windows"].size(), 2U);
  EXPECT_EQ(job["time_windows"][0U][0U].asInt64(), 3600);
  EXPECT_EQ(job["time_windows"][0U][1U].asInt64(), 7200);
  EXPECT_EQ(job["time_windows"][1U][0U].asInt64(), 10800);
  EXPECT_EQ(job["time_windows"][1U][1U].asInt64(), 14400);

  EXPECT_EQ((*payload)["jobs"][1U]["id"].asUInt64(), 2U);
  EXPECT_EQ((*payload)["jobs"][1U]["service"].asInt(), 120);
  EXPECT_FALSE((*payload)["jobs"][1U].isMember("time_windows"));

  const Json::Value& vehicle = (*payload)["vehicles"][0U];
  EXPECT_EQ(vehicle["id"].asUInt64(), 1U);
  EXPECT_EQ(vehicle["description"].asString(), "van-1");
  ASSERT_TRUE(vehicle["start"].isArray());
  EXPECT_DOUBLE_EQ(vehicle["start"][0U].asDouble(), 7.4236);
  EXPECT_DOUBLE_EQ(vehicle["start"][1U].asDouble(), 43.7384);
  ASSERT_TRUE(vehicle["end"].isArray());
  ASSERT_TRUE(vehicle["capacity"].isArray());
  EXPECT_EQ(vehicle["capacity"][0U].asInt(), 8);
  ASSERT_TRUE(vehicle["time_window"].isArray());
  EXPECT_EQ(vehicle["time_window"][0U].asInt64(), 0);
  EXPECT_EQ(vehicle["time_window"][1U].asInt64(), 86400);
}

TEST(OptimizeRequestTest, BuildVroomInputTextAppliesServiceAdjustment) {
  auto input = BuildInput();
  const std::string payload_text =
      deliveryoptimizer::api::BuildVroomInputText(input, /*service_adjustment_seconds=*/75);
  const auto payload = deliveryoptimizer::adapters::ParseJsonText(payload_text);

  ASSERT_TRUE(payload.has_value());
  EXPECT_EQ((*payload)["jobs"][0U]["service"].asInt(), 255);
  EXPECT_EQ((*payload)["jobs"][1U]["service"].asInt(), 195);
}

TEST(OptimizeRequestTest, BuildVroomInputTextClampsServiceAdjustmentWithoutOverflow) {
  auto input = BuildInput();
  input.jobs[0U].service = std::numeric_limits<int>::max();
  const std::string payload_text = deliveryoptimizer::api::BuildVroomInputText(
      input, /*service_adjustment_seconds=*/std::numeric_limits<int>::max());
  const auto payload = deliveryoptimizer::adapters::ParseJsonText(payload_text);

  ASSERT_TRUE(payload.has_value());
  EXPECT_EQ((*payload)["jobs"][0U]["service"].asInt(), std::numeric_limits<int>::max());
}

TEST(OptimizeRequestTest, BuildVroomInputTextProducesCompactDocument) {
  const auto input = BuildInput();
  const std::string payload_text = deliveryoptimizer::api::BuildVroomInputText(input);
  const auto payload = deliveryoptimizer::adapters::ParseJsonText(payload_text);

  ASSERT_TRUE(payload.has_value());
  ASSERT_TRUE((*payload).isMember("jobs"));
  ASSERT_TRUE((*payload).isMember("vehicles"));
  // The rendered document is a single compact JSON object with no trailing whitespace.
  EXPECT_EQ(payload_text.front(), '{');
  EXPECT_EQ(payload_text.back(), '}');
  EXPECT_EQ(payload_text.find("  "), std::string::npos);
}

TEST(OptimizeRequestTest, ParseAndValidateRejectsMalformedUtf8ExternalIds) {
  Json::Value request = BuildRequestJson();
  std::string malformed_id{"invalid-"};
  malformed_id.push_back(static_cast<char>(0xC3));
  malformed_id.push_back('(');
  request["vehicles"][0U]["id"] = malformed_id;
  request["jobs"][0U]["id"] = malformed_id;

  Json::Value issues;
  EXPECT_FALSE(
      deliveryoptimizer::api::ParseAndValidateOptimizeRequest(request, issues).has_value());
  ASSERT_EQ(issues.size(), 2U);
  EXPECT_EQ(issues[0U]["field"].asString(), "vehicles[0].id");
  EXPECT_EQ(issues[0U]["message"].asString(), "must contain valid UTF-8.");
  EXPECT_EQ(issues[1U]["field"].asString(), "jobs[0].id");
  EXPECT_EQ(issues[1U]["message"].asString(), "must contain valid UTF-8.");
}
