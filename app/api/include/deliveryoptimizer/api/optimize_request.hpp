#pragma once

#include "deliveryoptimizer/api/solve_admission.hpp"

#include <chrono>
#include <json/json.h>
#include <optional>
#include <string>
#include <vector>

namespace deliveryoptimizer::api {

struct Coordinate {
  double lon;
  double lat;
};

struct TimeWindow {
  std::chrono::sys_seconds start;
  std::chrono::sys_seconds end;
};

struct VehicleInput {
  std::string external_id;
  int capacity;
  std::optional<Coordinate> start;
  std::optional<Coordinate> end;
  std::optional<TimeWindow> time_window;
};

struct JobInput {
  std::string external_id;
  double lon;
  double lat;
  int demand;
  int service;
  std::optional<std::vector<TimeWindow>> time_windows;
};

struct OptimizeRequestInput {
  double depot_lon;
  double depot_lat;
  std::vector<VehicleInput> vehicles;
  std::vector<JobInput> jobs;
};

struct ParsedOptimizeRequest {
  OptimizeRequestInput input;
  SolveRequestSize size;
};

[[nodiscard]] std::optional<ParsedOptimizeRequest>
ParseAndValidateOptimizeRequest(const Json::Value& root, Json::Value& issues);

[[nodiscard]] std::optional<SolveRequestSize> TryParseOptimizeRequestSize(const Json::Value& root);

// Renders the VROOM payload directly to text, avoiding the per-node Json::Value
// tree. service_adjustment_seconds is added to every job's service when nonzero
// (used for weather-aware reoptimization).
[[nodiscard]] std::string BuildVroomInputText(const OptimizeRequestInput& input,
                                              int service_adjustment_seconds = 0);

// Takes ownership of the vroom output so its subtrees are moved into the response
// body instead of deep-copied (jsoncpp values are not copy-on-write).
[[nodiscard]] Json::Value
BuildOptimizeSuccessBody(const OptimizeRequestInput& input, Json::Value vroom_output,
                         std::optional<Json::Value> forecast = std::nullopt);

} // namespace deliveryoptimizer::api
