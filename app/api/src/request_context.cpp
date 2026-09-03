#include "deliveryoptimizer/api/observability.hpp"

#include <chrono>
#include <drogon/HttpRequest.h>
#include <drogon/utils/Utilities.h>
#include <string>
#include <utility>

namespace {

constexpr std::string_view kRequestContextAttributeKey = "deliveryoptimizer.request_context";
const std::string kRequestContextAttributeKeyString{kRequestContextAttributeKey};

} // namespace

namespace deliveryoptimizer::api {

void EnsureRequestContext(const drogon::HttpRequestPtr& request) {
  if (request == nullptr) {
    return;
  }

  const auto& attributes = request->attributes();
  if (attributes->find(kRequestContextAttributeKeyString)) {
    return;
  }

  attributes->insert(kRequestContextAttributeKeyString,
                     RequestContext{
                         .request_id = drogon::utils::getUuid(),
                         .started_at = std::chrono::steady_clock::now(),
                     });
}

const RequestContext* GetRequestContext(const drogon::HttpRequestPtr& request) {
  if (request == nullptr) {
    return nullptr;
  }

  const auto& attributes = request->attributes();
  if (!attributes->find(kRequestContextAttributeKeyString)) {
    return nullptr;
  }

  return &attributes->get<RequestContext>(kRequestContextAttributeKeyString);
}

SolveLifecycle CreateSolveLifecycle(const drogon::HttpRequestPtr& request) {
  EnsureRequestContext(request);
  const RequestContext* context = GetRequestContext(request);

  SolveLifecycle lifecycle{};
  lifecycle.request_id = context == nullptr ? drogon::utils::getUuid() : context->request_id;
  lifecycle.method = request == nullptr ? "" : request->getMethodString();
  lifecycle.path = request == nullptr ? "" : request->path();
  lifecycle.request_started_at =
      context == nullptr ? std::chrono::steady_clock::now() : context->started_at;
  return lifecycle;
}

} // namespace deliveryoptimizer::api
