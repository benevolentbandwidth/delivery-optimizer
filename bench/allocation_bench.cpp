// Allocation benchmark harness for the deliveryoptimizer hot paths.
//
// Counts every heap allocation (operator new / new[] / aligned new) and
// measures wall time per scenario. Scenarios mirror the request pipeline:
// - parse-request: parse and validate an optimization request.
// - parse-vroom-output: parse a large VROOM output document.
// - vroom-payload: render VROOM input directly to text.
// - success-body: enrich the response with external IDs.
// - to-coordinated / worker-flow: move solver output through execution.
// - log-line / request-context: exercise per-request infrastructure.
// - http-json-response: compare Drogon's copy and move overloads.
// - write-payload / spawn-args: compare runner setup mechanisms.

#include "deliveryoptimizer/adapters/json_utils.hpp"
#include "deliveryoptimizer/api/observability.hpp"
#include "deliveryoptimizer/api/optimize_request.hpp"
#include "deliveryoptimizer/api/solve_execution.hpp"
#include "deliveryoptimizer/api/vroom_runner.hpp"

#include <array>
#include <atomic>
#include <charconv>
#include <chrono>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <drogon/drogon.h>
#include <fstream>
#include <functional>
#include <iostream>
#include <json/json.h>
#include <new>
#include <optional>
#include <string>
#include <string_view>
#include <utility>
#include <vector>

namespace {

std::atomic<std::uint64_t> g_allocs{0U};
std::atomic<std::uint64_t> g_bytes{0U};

void ResetCounters() {
  g_allocs.store(0U, std::memory_order_relaxed);
  g_bytes.store(0U, std::memory_order_relaxed);
}

struct Counts {
  std::uint64_t allocs{0U};
  std::uint64_t bytes{0U};
};

[[nodiscard]] Counts ReadCounters() {
  return Counts{
      .allocs = g_allocs.load(std::memory_order_relaxed),
      .bytes = g_bytes.load(std::memory_order_relaxed),
  };
}

void CountAllocation(const std::size_t size) {
  g_allocs.fetch_add(1U, std::memory_order_relaxed);
  g_bytes.fetch_add(static_cast<std::uint64_t>(size), std::memory_order_relaxed);
}

} // namespace

// -- global allocation counting -------------------------------------------------

void* operator new(std::size_t size) {
  CountAllocation(size);
  if (void* memory = std::malloc(size == 0U ? 1U : size)) {
    return memory;
  }
  throw std::bad_alloc{};
}

void* operator new[](std::size_t size) {
  return ::operator new(size);
}

void* operator new(std::size_t size, const std::nothrow_t&) noexcept {
  try {
    return ::operator new(size);
  } catch (...) {
    return nullptr;
  }
}

void* operator new[](std::size_t size, const std::nothrow_t&) noexcept {
  return ::operator new(size, std::nothrow);
}

void* operator new(std::size_t size, std::align_val_t alignment) {
  CountAllocation(size);
  void* memory = nullptr;
  const std::size_t requested = size == 0U ? 1U : size;
  if (posix_memalign(&memory,
                     static_cast<std::size_t>(alignment) < sizeof(void*)
                         ? sizeof(void*)
                         : static_cast<std::size_t>(alignment),
                     requested) != 0) {
    throw std::bad_alloc{};
  }
  return memory;
}

void* operator new[](std::size_t size, std::align_val_t alignment) {
  return ::operator new(size, alignment);
}

void* operator new(std::size_t size, std::align_val_t alignment, const std::nothrow_t&) noexcept {
  try {
    return ::operator new(size, alignment);
  } catch (...) {
    return nullptr;
  }
}

void* operator new[](std::size_t size, std::align_val_t alignment, const std::nothrow_t&) noexcept {
  return ::operator new(size, alignment, std::nothrow);
}

void operator delete(void* memory) noexcept {
  std::free(memory);
}
void operator delete(void* memory, std::size_t) noexcept {
  std::free(memory);
}
void operator delete[](void* memory) noexcept {
  std::free(memory);
}
void operator delete[](void* memory, std::size_t) noexcept {
  std::free(memory);
}
void operator delete(void* memory, std::align_val_t) noexcept {
  std::free(memory);
}
void operator delete(void* memory, std::size_t, std::align_val_t) noexcept {
  std::free(memory);
}
void operator delete[](void* memory, std::align_val_t) noexcept {
  std::free(memory);
}
void operator delete[](void* memory, std::size_t, std::align_val_t) noexcept {
  std::free(memory);
}
void operator delete(void* memory, const std::nothrow_t&) noexcept {
  std::free(memory);
}
void operator delete[](void* memory, const std::nothrow_t&) noexcept {
  std::free(memory);
}

namespace {

using SteadyClock = std::chrono::steady_clock;

struct ScenarioResult {
  const char* name;
  std::uint64_t allocs_per_iter;
  std::uint64_t bytes_per_iter;
  double microseconds_per_iter;
};

template <typename Callable>
[[nodiscard]] ScenarioResult RunScenario(const char* name, const int warmup_iters,
                                         const int measured_iters, Callable&& callable) {
  for (int index = 0; index < warmup_iters; ++index) {
    callable();
  }

  ResetCounters();
  const auto started_at = SteadyClock::now();
  for (int index = 0; index < measured_iters; ++index) {
    callable();
  }
  const auto finished_at = SteadyClock::now();
  const Counts counts = ReadCounters();

  const double microseconds =
      static_cast<double>(
          std::chrono::duration_cast<std::chrono::microseconds>(finished_at - started_at).count()) /
      static_cast<double>(measured_iters);
  return ScenarioResult{
      .name = name,
      .allocs_per_iter = counts.allocs / static_cast<std::uint64_t>(measured_iters),
      .bytes_per_iter = counts.bytes / static_cast<std::uint64_t>(measured_iters),
      .microseconds_per_iter = microseconds,
  };
}

void PrintResult(const ScenarioResult& result) {
  std::printf("%-22s allocs/iter=%8llu  bytes/iter=%10llu  us/iter=%10.1f\n", result.name,
              static_cast<unsigned long long>(result.allocs_per_iter),
              static_cast<unsigned long long>(result.bytes_per_iter), result.microseconds_per_iter);
}

// -- fixtures -------------------------------------------------------------------

[[nodiscard]] deliveryoptimizer::api::OptimizeRequestInput MakeInput(const int job_count,
                                                                     const int vehicle_count) {
  deliveryoptimizer::api::OptimizeRequestInput input{
      .depot_lon = 7.4236,
      .depot_lat = 43.7384,
  };
  input.vehicles.reserve(static_cast<std::size_t>(vehicle_count));
  for (int index = 0; index < vehicle_count; ++index) {
    input.vehicles.push_back(deliveryoptimizer::api::VehicleInput{
        .external_id = "van-" + std::to_string(index + 1),
        .capacity = 8,
        .start = deliveryoptimizer::api::Coordinate{.lon = 7.4236, .lat = 43.7384},
        .end = deliveryoptimizer::api::Coordinate{.lon = 7.4236, .lat = 43.7384},
        .time_window =
            deliveryoptimizer::api::TimeWindow{
                .start = std::chrono::sys_seconds{std::chrono::seconds{0}},
                .end = std::chrono::sys_seconds{std::chrono::seconds{86400}},
            },
    });
  }
  input.jobs.reserve(static_cast<std::size_t>(job_count));
  for (int index = 0; index < job_count; ++index) {
    const double offset = static_cast<double>(index) * 0.001;
    input.jobs.push_back(deliveryoptimizer::api::JobInput{
        .external_id = "order-" + std::to_string(index + 1),
        .lon = 7.4200 + offset,
        .lat = 43.7300 + offset,
        .demand = 1,
        .service = 120,
        .time_windows =
            std::vector<deliveryoptimizer::api::TimeWindow>{
                deliveryoptimizer::api::TimeWindow{
                    .start = std::chrono::sys_seconds{std::chrono::seconds{0}},
                    .end = std::chrono::sys_seconds{std::chrono::seconds{86400}},
                },
            },
    });
  }
  return input;
}

[[nodiscard]] std::string MakeRequestText(const int job_count, const int vehicle_count) {
  std::string text;
  text.reserve(static_cast<std::size_t>(job_count) * 140U +
               static_cast<std::size_t>(vehicle_count) * 180U + 128U);
  text += "{\"depot\":{\"location\":[7.4236,43.7384]},\"vehicles\":[";
  for (int index = 0; index < vehicle_count; ++index) {
    if (index != 0) {
      text += ',';
    }
    text += "{\"id\":\"van-";
    text += std::to_string(index + 1);
    text += "\",\"capacity\":8,\"start\":[7.4236,43.7384],\"end\":[7.4236,43.7384],"
            "\"time_window\":[0,86400]}";
  }
  text += "],\"jobs\":[";
  for (int index = 0; index < job_count; ++index) {
    if (index != 0) {
      text += ',';
    }
    const double lon = 7.42 + static_cast<double>(index) * 0.001;
    const double lat = 43.73 + static_cast<double>(index) * 0.001;
    text += "{\"id\":\"order-";
    text += std::to_string(index + 1);
    text += "\",\"location\":[";
    text += std::to_string(lon);
    text += ',';
    text += std::to_string(lat);
    text += "],\"demand\":1,\"service\":120,\"time_windows\":[[0,86400]]}";
  }
  text += "]}";
  return text;
}

// Mirrors the shape of a vroom response: summary + per-route steps + unassigned.
[[nodiscard]] Json::Value MakeVroomOutput(const int job_count, const int vehicle_count) {
  Json::Value output{Json::objectValue};
  output["summary"] = Json::Value{Json::objectValue};
  output["summary"]["cost"] = 123456;
  output["summary"]["routes"] = vehicle_count;
  output["summary"]["unassigned"] = 3;
  output["summary"]["delivery"] = Json::Value{Json::arrayValue};
  output["summary"]["delivery"][0U] = Json::Int64{job_count};
  output["summary"]["amount"] = Json::Value{Json::arrayValue};
  output["summary"]["amount"][0U] = Json::Int64{job_count};
  output["summary"]["duration"] = 7200.0;
  output["summary"]["distance"] = 54321.0;

  output["routes"] = Json::Value{Json::arrayValue};
  int job_id = 1;
  for (int vehicle = 1; vehicle <= vehicle_count; ++vehicle) {
    Json::Value route{Json::objectValue};
    route["vehicle"] = Json::Int64{vehicle};
    route["cost"] = 1000 + vehicle;
    route["delivery"] = Json::Value{Json::arrayValue};
    route["delivery"][0U] = Json::Int64{2};
    route["amount"] = Json::Value{Json::arrayValue};
    route["amount"][0U] = Json::Int64{2};
    route["duration"] = 1800.0;
    route["distance"] = 1234.0;
    route["steps"] = Json::Value{Json::arrayValue};

    Json::Value start_step{Json::objectValue};
    start_step["type"] = "start";
    start_step["location"] = Json::Value{Json::arrayValue};
    start_step["location"][0U] = 7.4236;
    start_step["location"][1U] = 43.7384;
    start_step["setup"] = 0;
    start_step["service"] = 0;
    start_step["waiting_time"] = 0;
    start_step["arrival"] = 0;
    start_step["duration"] = 0;
    route["steps"].append(start_step);

    for (int step = 0; step < 2 && job_id <= job_count; ++step, ++job_id) {
      Json::Value job_step{Json::objectValue};
      job_step["type"] = "job";
      job_step["location"] = Json::Value{Json::arrayValue};
      job_step["location"][0U] = 7.42 + static_cast<double>(job_id) * 0.001;
      job_step["location"][1U] = 43.73 + static_cast<double>(job_id) * 0.001;
      job_step["setup"] = 0;
      job_step["service"] = 120;
      job_step["waiting_time"] = 0;
      job_step["job"] = Json::Int64{job_id};
      job_step["arrival"] = 100 + job_id;
      job_step["duration"] = 100 + job_id;
      route["steps"].append(job_step);
    }

    Json::Value end_step{Json::objectValue};
    end_step["type"] = "end";
    end_step["location"] = Json::Value{Json::arrayValue};
    end_step["location"][0U] = 7.4236;
    end_step["location"][1U] = 43.7384;
    end_step["setup"] = 0;
    end_step["service"] = 0;
    end_step["waiting_time"] = 0;
    end_step["arrival"] = 2000;
    end_step["duration"] = 2000;
    route["steps"].append(end_step);

    output["routes"].append(route);
  }

  output["unassigned"] = Json::Value{Json::arrayValue};
  for (int index = 0; index < 3; ++index) {
    Json::Value unassigned_entry{Json::objectValue};
    unassigned_entry["id"] = Json::Int64{job_count - index};
    unassigned_entry["location"] = Json::Value{Json::arrayValue};
    unassigned_entry["location"][0U] = 7.42;
    unassigned_entry["location"][1U] = 43.73;
    output["unassigned"].append(unassigned_entry);
  }
  return output;
}

[[nodiscard]] deliveryoptimizer::api::VroomRunResult MakeRunResult(const Json::Value& output) {
  return deliveryoptimizer::api::VroomRunResult{
      .status = deliveryoptimizer::api::VroomRunStatus::kSuccess,
      .output = output,
  };
}

[[nodiscard]] std::string RenderJson(const Json::Value& value) {
  Json::StreamWriterBuilder writer_builder;
  writer_builder["indentation"] = "";
  return Json::writeString(writer_builder, value);
}

// Replica of the baseline WritePayloadToFile rendering path.
void WritePayloadViaString(const std::string& path, const Json::Value& payload) {
  Json::StreamWriterBuilder writer_builder;
  writer_builder["indentation"] = "";
  const std::string payload_text = Json::writeString(writer_builder, payload);
  std::ofstream stream(path, std::ios::binary | std::ios::trunc);
  stream << payload_text;
}

// Replica of the optimized WritePayloadToFile rendering path.
void WritePayloadViaStreamWriter(const std::string& path, const Json::Value& payload) {
  static const Json::StreamWriterBuilder writer_builder = [] {
    Json::StreamWriterBuilder builder;
    builder["indentation"] = "";
    return builder;
  }();
  std::ofstream stream(path, std::ios::binary | std::ios::trunc);
  writer_builder.newStreamWriter()->write(payload, &stream);
}

struct BaselineSpawnArgumentsReplica {
  std::vector<std::string> storage;
  std::vector<const char*> argv;
};

struct OptimizedSpawnArgumentsReplica {
  OptimizedSpawnArgumentsReplica(const deliveryoptimizer::api::VroomRuntimeConfig& runtime_config,
                                 const std::string& input_file_path) {
    const auto [timeout_end, timeout_error] =
        std::to_chars(timeout_storage.data(), timeout_storage.data() + timeout_storage.size() - 1U,
                      runtime_config.timeout_seconds);
    if (timeout_error != std::errc{}) {
      timeout_storage[0] = '3';
      timeout_storage[1] = '0';
      timeout_storage[2] = '\0';
    } else {
      *timeout_end = '\0';
    }
    argv = {
        runtime_config.vroom_bin.data(),
        "--router",
        runtime_config.vroom_router.data(),
        "--host",
        runtime_config.vroom_host.data(),
        "--port",
        runtime_config.vroom_port.data(),
        "--limit",
        timeout_storage.data(),
        "--input",
        input_file_path.data(),
        "--output",
        "/dev/stdout",
        nullptr,
    };
  }

  std::array<char, 32> timeout_storage{};
  std::array<const char*, 14> argv{};
};

// Replica of the baseline BuildSpawnArguments.
[[nodiscard]] BaselineSpawnArgumentsReplica
BuildSpawnArgumentsBaseline(const deliveryoptimizer::api::VroomRuntimeConfig& runtime_config,
                            const std::string& input_file_path) {
  BaselineSpawnArgumentsReplica spawn_arguments;
  spawn_arguments.storage = {
      runtime_config.vroom_bin,
      "--router",
      runtime_config.vroom_router,
      "--host",
      runtime_config.vroom_host,
      "--port",
      runtime_config.vroom_port,
      "--limit",
      std::to_string(runtime_config.timeout_seconds),
      "--input",
      input_file_path,
      "--output",
      std::string{"/dev/stdout"},
  };
  spawn_arguments.argv.reserve(spawn_arguments.storage.size() + 1U);
  for (std::string& argument : spawn_arguments.storage) {
    spawn_arguments.argv.push_back(argument.data());
  }
  spawn_arguments.argv.push_back(nullptr);
  return spawn_arguments;
}

// Replica of the optimized BuildSpawnArguments (fixed-size argv points at
// config members; only the small derived strings are owned).
[[nodiscard]] OptimizedSpawnArgumentsReplica
BuildSpawnArgumentsOptimized(const deliveryoptimizer::api::VroomRuntimeConfig& runtime_config,
                             const std::string& input_file_path) {
  return OptimizedSpawnArgumentsReplica{runtime_config, input_file_path};
}

} // namespace

int main() {
  constexpr int kJobCount = 1000;
  constexpr int kVehicleCount = 50;

  const deliveryoptimizer::api::OptimizeRequestInput input = MakeInput(kJobCount, kVehicleCount);
  const std::string request_text = MakeRequestText(kJobCount, kVehicleCount);
  const Json::Value vroom_output = MakeVroomOutput(kJobCount, kVehicleCount);
  const std::string vroom_output_text = RenderJson(vroom_output);
  const std::string vroom_payload_text = deliveryoptimizer::api::BuildVroomInputText(input);
  const std::optional<Json::Value> no_forecast = std::nullopt;

  auto request_root = deliveryoptimizer::adapters::ParseJsonText(request_text);
  Json::Value issues{Json::arrayValue};

  std::puts("== allocation benchmark (optimized) ==");
  std::printf("request text: %zu bytes, vroom payload: %zu bytes, vroom output: %zu bytes\n",
              request_text.size(), vroom_payload_text.size(), vroom_output_text.size());

  // 1. async worker parse + validate
  PrintResult(RunScenario("parse-request", 3, 100, [&] {
    auto root = deliveryoptimizer::adapters::ParseJsonText(request_text);
    (void)deliveryoptimizer::api::ParseAndValidateOptimizeRequest(*root, issues);
  }));

  // 2. runner parses the vroom output document
  PrintResult(RunScenario("parse-vroom-output", 3, 100, [&] {
    (void)deliveryoptimizer::adapters::ParseJsonText(vroom_output_text);
  }));

  // 3. build vroom input payload (direct text render)
  PrintResult(RunScenario("vroom-payload", 3, 100,
                          [&] { (void)deliveryoptimizer::api::BuildVroomInputText(input); }));

  // 4. success response body enrichment
  PrintResult(RunScenario("success-body", 3, 100, [&] {
    Json::Value output = vroom_output;
    (void)deliveryoptimizer::api::BuildOptimizeSuccessBody(input, std::move(output), no_forecast);
  }));

  // 5. coordinator result conversion
  PrintResult(RunScenario("to-coordinated", 3, 100, [&] {
    deliveryoptimizer::api::VroomRunResult run = MakeRunResult(vroom_output);
    (void)deliveryoptimizer::api::ToCoordinatedSolveResult(std::move(run));
  }));

  // 6. worker loop flow: convert + final assignment (moved) + execution result
  PrintResult(RunScenario("worker-flow", 3, 100, [&] {
    deliveryoptimizer::api::VroomRunResult run = MakeRunResult(vroom_output);
    auto coordinated_result = deliveryoptimizer::api::ToCoordinatedSolveResult(std::move(run));
    auto final_result = std::move(coordinated_result); // optimized: moves, no deep copy
    (void)deliveryoptimizer::api::BuildSolveExecutionResult(input, std::move(final_result),
                                                            no_forecast);
  }));

  // 7. per-request structured log line
  auto observability = std::make_shared<deliveryoptimizer::api::ObservabilityRegistry>(
      deliveryoptimizer::api::ObservabilityOptions{
          .max_pending_log_lines = 100000U,
          .start_log_writer = false,
      });
  auto lifecycle = std::make_shared<deliveryoptimizer::api::SolveLifecycle>();
  lifecycle->request_id = "req-11111111-2222-3333-4444-555555555555";
  lifecycle->method = "POST";
  lifecycle->path = "/api/v1/deliveries/optimize";
  lifecycle->request_started_at = SteadyClock::now();
  lifecycle->queue_wait_duration = std::chrono::milliseconds{5};
  lifecycle->solve_duration = std::chrono::milliseconds{120};
  PrintResult(RunScenario("log-line", 3, 200, [&] {
    deliveryoptimizer::api::FinalizeSolveRequest(
        observability, lifecycle, deliveryoptimizer::api::SolveRequestOutcome::kSucceeded, 200U);
  }));

  // 8. request context attributes (request created once; per-request attribute work only)
  auto context_request = drogon::HttpRequest::newHttpRequest();
  context_request->setMethod(drogon::Post);
  context_request->setPath("/api/v1/deliveries/optimize");
  context_request->setBody(request_text);
  PrintResult(RunScenario("request-context", 3, 100, [&] {
    deliveryoptimizer::api::EnsureRequestContext(context_request);
    (void)deliveryoptimizer::api::GetRequestContext(context_request);
    (void)deliveryoptimizer::api::CreateSolveLifecycle(context_request);
  }));

  // 9. drogon JSON response construction: copy overload vs move overload
  PrintResult(RunScenario("http-json-response-copy", 3, 100, [&] {
    Json::Value body = vroom_output;
    (void)drogon::HttpResponse::newHttpJsonResponse(body);
  }));
  PrintResult(RunScenario("http-json-response-move", 3, 100, [&] {
    Json::Value body = vroom_output;
    (void)drogon::HttpResponse::newHttpJsonResponse(std::move(body));
  }));

  // 10. payload render + temp-file write: string path vs direct stream path
  const std::string temp_path = "/tmp/deliveryoptimizer_bench_payload.json";
  PrintResult(RunScenario("write-payload-string", 3, 100,
                          [&] { WritePayloadViaString(temp_path, vroom_output); }));
  PrintResult(RunScenario("write-payload-stream", 3, 100,
                          [&] { WritePayloadViaStreamWriter(temp_path, vroom_output); }));

  // 11. spawn argv construction per solve
  const deliveryoptimizer::api::VroomRuntimeConfig runtime_config{
      .vroom_bin = "/usr/local/bin/vroom",
      .vroom_router = "osrm",
      .vroom_host = "osrm",
      .vroom_port = "5001",
      .timeout_seconds = 30,
  };
  const std::string spawn_input_path = "/tmp/deliveryoptimizer-input.json";
  PrintResult(RunScenario("spawn-args-baseline", 3, 100, [&] {
    (void)BuildSpawnArgumentsBaseline(runtime_config, spawn_input_path);
  }));
  PrintResult(RunScenario("spawn-args-optimized", 3, 100, [&] {
    (void)BuildSpawnArgumentsOptimized(runtime_config, spawn_input_path);
  }));

  // 12. std::function capture size: captures larger than the 16-byte small-buffer
  // optimization heap-allocate one closure per submit (the pre-optimization sync
  // endpoint callback captured weather options strings + nested lambdas).
  struct RequestBundle {
    std::string weather_base_url;
    std::string api_key;
  };
  auto bundle = std::make_shared<RequestBundle>();
  bundle->weather_base_url = "https://api.openweathermap.org";
  bundle->api_key = "";
  PrintResult(RunScenario("closure-sbo-single-ptr", 3, 100, [&] {
    std::function<void()> closure = [bundle] { (void)bundle; };
    (void)closure;
  }));
  PrintResult(RunScenario("closure-heap-big-capture", 3, 100, [&] {
    // Mirrors the pre-optimization capture shape: two shared_ptrs + weather options
    // strings pushes the closure past the 16-byte SBO, so std::function heap-
    // allocates the callable on every construction.
    auto lifecycle = std::make_shared<deliveryoptimizer::api::SolveLifecycle>();
    const std::string weather_base_url = "https://api.openweathermap.org";
    const std::string api_key = "";
    std::function<void()> closure = [bundle, lifecycle, weather_base_url, api_key] {
      (void)bundle;
      (void)lifecycle;
      (void)weather_base_url;
      (void)api_key;
    };
    (void)closure;
  }));

  (void)request_root;
  return 0;
}
