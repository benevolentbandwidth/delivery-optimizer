#include "deliveryoptimizer/api/endpoints/deliveries_optimize_endpoint.hpp"

#include "deliveryoptimizer/api/forecast_optimizer.hpp"
#include "deliveryoptimizer/api/observability.hpp"
#include "deliveryoptimizer/api/optimize_request.hpp"
#include "deliveryoptimizer/api/solve_coordinator.hpp"
#include "deliveryoptimizer/api/solve_execution.hpp"
#include "deliveryoptimizer/api/vroom_runner.hpp"

#include <drogon/drogon.h>
#include <functional>
#include <json/json.h>
#include <memory>
#include <optional>
#include <string_view>
#include <thread>
#include <trantor/net/EventLoop.h>
#include <utility>

namespace {

struct CompletedResponse {
  drogon::HttpResponsePtr response;
  deliveryoptimizer::api::SolveRequestOutcome outcome;
};

[[nodiscard]] drogon::HttpResponsePtr BuildErrorResponse(const drogon::HttpStatusCode code,
                                                         const std::string_view error_message) {
  Json::Value body{Json::objectValue};
  body["error"] = std::string{error_message};
  auto response = drogon::HttpResponse::newHttpJsonResponse(body);
  response->setStatusCode(code);
  return response;
}

[[nodiscard]] drogon::HttpResponsePtr BuildValidationResponse(const Json::Value& issues) {
  Json::Value body{Json::objectValue};
  body["error"] = "Validation failed.";
  body["issues"] = issues;
  auto response = drogon::HttpResponse::newHttpJsonResponse(body);
  response->setStatusCode(drogon::k400BadRequest);
  return response;
}

[[nodiscard]] CompletedResponse
BuildAdmissionRejectionResponse(const deliveryoptimizer::api::SolveAdmissionStatus status) {
  switch (status) {
  case deliveryoptimizer::api::SolveAdmissionStatus::kRejectedTooManyJobs:
  case deliveryoptimizer::api::SolveAdmissionStatus::kRejectedTooManyVehicles:
    return CompletedResponse{
        .response =
            BuildErrorResponse(drogon::k422UnprocessableEntity,
                               "Routing optimization is unavailable for requests of this size."),
        .outcome = status == deliveryoptimizer::api::SolveAdmissionStatus::kRejectedTooManyJobs
                       ? deliveryoptimizer::api::SolveRequestOutcome::kRejectedTooManyJobs
                       : deliveryoptimizer::api::SolveRequestOutcome::kRejectedTooManyVehicles,
    };
  case deliveryoptimizer::api::SolveAdmissionStatus::kRejectedQueueFull:
    return CompletedResponse{
        .response = BuildErrorResponse(drogon::k503ServiceUnavailable,
                                       "Routing optimization is temporarily overloaded."),
        .outcome = deliveryoptimizer::api::SolveRequestOutcome::kRejectedQueueFull,
    };
  case deliveryoptimizer::api::SolveAdmissionStatus::kAccepted:
    break;
  }

  return CompletedResponse{
      .response = BuildErrorResponse(drogon::k502BadGateway, "Routing optimization failed."),
      .outcome = deliveryoptimizer::api::SolveRequestOutcome::kFailed,
  };
}

[[nodiscard]] CompletedResponse
BuildSolveExecutionResponse(const deliveryoptimizer::api::SolveExecutionResult& result) {
  if (result.response_body.has_value()) {
    auto response = drogon::HttpResponse::newHttpJsonResponse(*result.response_body);
    response->setStatusCode(static_cast<drogon::HttpStatusCode>(result.http_status));
    return CompletedResponse{
        .response = response,
        .outcome = result.outcome,
    };
  }

  return CompletedResponse{
      .response = BuildErrorResponse(static_cast<drogon::HttpStatusCode>(result.http_status),
                                     result.error_message),
      .outcome = result.outcome,
  };
}

void DispatchResponse(
    trantor::EventLoop* response_loop,
    const std::shared_ptr<std::function<void(const drogon::HttpResponsePtr&)>>& callback,
    const drogon::HttpResponsePtr& response) {
  response_loop->queueInLoop([callback, response] { (*callback)(response); });
}

void FinishWithTraffic(const std::shared_ptr<deliveryoptimizer::api::SolveCoordinator>& coordinator,
                       std::shared_ptr<deliveryoptimizer::api::OptimizeRequestInput> optimize_request,
                       const deliveryoptimizer::api::SolveRequestSize request_size,
                       deliveryoptimizer::api::TrafficForecastOptions traffic_options,
                       std::optional<Json::Value> forecast,
                       const deliveryoptimizer::api::WeatherImpactEstimate weather_impact,
                       std::function<void(const CompletedResponse&)> respond_with_completion,
                       deliveryoptimizer::api::CoordinatedSolveResult weather_result) {
  if (!weather_result.output.has_value()) {
    const deliveryoptimizer::api::SolveExecutionResult response_result =
        deliveryoptimizer::api::BuildSolveExecutionResult(*optimize_request, weather_result,
                                                          forecast);
    respond_with_completion(BuildSolveExecutionResponse(response_result));
    return;
  }

  std::thread([coordinator, optimize_request = std::move(optimize_request), request_size,
               traffic_options = std::move(traffic_options), forecast = std::move(forecast),
               weather_impact, respond_with_completion = std::move(respond_with_completion),
               weather_result = std::move(weather_result)]() mutable {
    std::optional<Json::Value> final_forecast = forecast;
    const Json::Value& route_output = *weather_result.output;

    const deliveryoptimizer::api::TrafficDelayEstimate traffic_delay =
        deliveryoptimizer::api::ReadRouteTraffic(
            traffic_options, route_output,
            deliveryoptimizer::api::ReadRouteStartTime(*optimize_request));
    const deliveryoptimizer::api::TrafficImpact traffic =
        deliveryoptimizer::api::EstimateTrafficImpact(
            traffic_options, deliveryoptimizer::api::ReadVroomDuration(route_output).value_or(0),
            traffic_delay.delay_seconds, traffic_delay.source);
    if (final_forecast.has_value()) {
      deliveryoptimizer::api::AddTrafficForecast(*final_forecast, traffic_options, traffic);
    }

    if (traffic.should_reoptimize) {
      const deliveryoptimizer::api::SolveAdmissionStatus traffic_rerun_status = coordinator->Submit(
          request_size,
          [optimize_request, weather_impact, traffic] {
            return deliveryoptimizer::api::BuildTrafficAdjustedVroomInput(*optimize_request,
                                                                          weather_impact, traffic);
          },
          [optimize_request, final_forecast, respond_with_completion](
              const deliveryoptimizer::api::CoordinatedSolveResult& traffic_result) mutable {
            const deliveryoptimizer::api::SolveExecutionResult response_result =
                deliveryoptimizer::api::BuildSolveExecutionResult(*optimize_request,
                                                                  traffic_result, final_forecast);
            respond_with_completion(BuildSolveExecutionResponse(response_result));
          });
      if (traffic_rerun_status != deliveryoptimizer::api::SolveAdmissionStatus::kAccepted) {
        respond_with_completion(BuildAdmissionRejectionResponse(traffic_rerun_status));
      }
      return;
    }

    const deliveryoptimizer::api::SolveExecutionResult response_result =
        deliveryoptimizer::api::BuildSolveExecutionResult(*optimize_request, weather_result,
                                                          final_forecast);
    respond_with_completion(BuildSolveExecutionResponse(response_result));
  }).detach();
}

} // namespace

namespace deliveryoptimizer::api {

void RegisterDeliveriesOptimizeEndpoint(drogon::HttpAppFramework& app,
                                        const SolveAdmissionConfig& admission_config,
                                        std::shared_ptr<ObservabilityRegistry> observability) {
  const WeatherForecastOptions weather_options = ResolveWeatherForecastOptionsFromEnv();
  const TrafficForecastOptions traffic_options = ResolveTrafficForecastOptionsFromEnv();
  auto runner = std::make_shared<ProcessVroomRunner>(ResolveVroomRuntimeConfigFromEnv());
  auto coordinator = std::make_shared<SolveCoordinator>(admission_config, runner,
                                                        SolveCoordinatorOptions{}, observability);

  app.registerHandler(
      "/api/v1/deliveries/optimize",
      [coordinator = std::move(coordinator), weather_options, traffic_options,
       observability = std::move(observability)](
          const drogon::HttpRequestPtr& request,
          std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
        auto lifecycle = std::make_shared<SolveLifecycle>(CreateSolveLifecycle(request));
        auto response_callback =
            std::make_shared<std::function<void(const drogon::HttpResponsePtr&)>>(
                std::move(callback));
        trantor::EventLoop* response_loop = trantor::EventLoop::getEventLoopOfCurrentThread();
        if (response_loop == nullptr) {
          response_loop = drogon::app().getLoop();
        }

        const auto respond = [response_callback,
                              response_loop](const drogon::HttpResponsePtr& response) {
          DispatchResponse(response_loop, response_callback, response);
        };
        const auto respond_with_completion =
            [respond, observability, lifecycle](const CompletedResponse& completed_response) {
              FinalizeSolveRequest(
                  observability, lifecycle, completed_response.outcome,
                  static_cast<std::uint16_t>(completed_response.response->getStatusCode()));
              respond(completed_response.response);
            };

        const auto& parsed_json = request->getJsonObject();
        if (!parsed_json) {
          respond_with_completion(CompletedResponse{
              .response =
                  BuildErrorResponse(drogon::k400BadRequest, "Request body must be valid JSON."),
              .outcome = SolveRequestOutcome::kInvalidJson,
          });
          return;
        }

        const auto early_request_size = TryParseOptimizeRequestSize(*parsed_json);
        if (early_request_size.has_value()) {
          lifecycle->jobs = early_request_size->jobs;
          lifecycle->vehicles = early_request_size->vehicles;
          const SolveAdmissionStatus admission_status =
              coordinator->CheckAdmission(*early_request_size, lifecycle);
          if (admission_status != SolveAdmissionStatus::kAccepted) {
            respond_with_completion(BuildAdmissionRejectionResponse(admission_status));
            return;
          }
        }

        Json::Value issues{Json::arrayValue};
        auto parsed_request = ParseAndValidateOptimizeRequest(*parsed_json, issues);
        if (!parsed_request.has_value()) {
          respond_with_completion(CompletedResponse{
              .response = BuildValidationResponse(issues),
              .outcome = SolveRequestOutcome::kValidationFailed,
          });
          return;
        }

        auto optimize_request_ptr =
            std::make_shared<OptimizeRequestInput>(std::move(parsed_request->input));
        lifecycle->jobs = optimize_request_ptr->jobs.size();
        lifecycle->vehicles = optimize_request_ptr->vehicles.size();

        const SolveRequestSize request_size{
            .jobs = optimize_request_ptr->jobs.size(),
            .vehicles = optimize_request_ptr->vehicles.size(),
        };
        const SolveAdmissionStatus admission_status = coordinator->Submit(
            request_size, [optimize_request_ptr] { return BuildVroomInput(*optimize_request_ptr); },
            [coordinator, optimize_request_ptr, request_size, weather_options, traffic_options,
             respond_with_completion](const CoordinatedSolveResult& result) mutable {
              std::optional<Json::Value> forecast;
              if (!result.output.has_value()) {
                respond_with_completion(BuildSolveExecutionResponse(
                    BuildSolveExecutionResult(*optimize_request_ptr, result, forecast)));
                return;
              }

              WeatherForecastOptions sync_weather_options = weather_options;
              // Clear the key so recalculation short-circuits OpenWeather; sync path must not
              // block the event loop.
              sync_weather_options.openweather_api_key.clear();
              const WeatherImpactEstimate impact = RecalculateWeatherImpact(
                  sync_weather_options, *optimize_request_ptr, *result.output);
              forecast = BuildWeatherForecastAnnotation(sync_weather_options, impact);

              if (!impact.should_reoptimize) {
                FinishWithTraffic(coordinator, optimize_request_ptr, request_size, traffic_options,
                                  forecast, impact, respond_with_completion, result);
                return;
              }

              const SolveAdmissionStatus rerun_status = coordinator->Submit(
                  request_size,
                  [optimize_request_ptr, impact] {
                    return BuildWeatherAdjustedVroomInput(*optimize_request_ptr, impact);
                  },
                  [coordinator, optimize_request_ptr, request_size, traffic_options, forecast,
                   impact, respond_with_completion](
                      const CoordinatedSolveResult& rerun_result) mutable {
                    FinishWithTraffic(coordinator, optimize_request_ptr, request_size,
                                      traffic_options, forecast, impact, respond_with_completion,
                                      rerun_result);
                  });
              if (rerun_status != SolveAdmissionStatus::kAccepted) {
                respond_with_completion(BuildAdmissionRejectionResponse(rerun_status));
              }
            },
            lifecycle);
        if (admission_status != SolveAdmissionStatus::kAccepted) {
          respond_with_completion(BuildAdmissionRejectionResponse(admission_status));
        }
      },
      {drogon::Post});
}

} // namespace deliveryoptimizer::api
