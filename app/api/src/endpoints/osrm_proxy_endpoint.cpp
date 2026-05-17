#include "deliveryoptimizer/api/endpoints/osrm_proxy_endpoint.hpp"

#include "env_utils.hpp"

#include <array>
#include <cctype>
#include <drogon/drogon.h>
#include <string>
#include <string_view>
#include <utility>

namespace {

constexpr std::string_view kDefaultOsrmBaseUrl = "http://127.0.0.1:5001";

[[nodiscard]] bool IsAllowedService(const std::string_view service_name) {
  return service_name == "nearest" || service_name == "route" || service_name == "table" ||
         service_name == "match";
}

[[nodiscard]] std::string_view ResolveServiceName(const std::string_view path_suffix) {
  const auto separator = path_suffix.find('/');
  if (separator == std::string_view::npos) {
    return path_suffix;
  }

  return path_suffix.substr(0, separator);
}

[[nodiscard]] bool HasEncodedPathSeparatorOrDot(const std::string_view value) {
  for (std::size_t index = 0; index + 2U < value.size(); ++index) {
    if (value[index] != '%') {
      continue;
    }

    const auto first = static_cast<unsigned char>(value[index + 1U]);
    const auto second = static_cast<unsigned char>(value[index + 2U]);
    const char hex_first = static_cast<char>(std::tolower(first));
    const char hex_second = static_cast<char>(std::tolower(second));
    if ((hex_first == '2' && (hex_second == 'e' || hex_second == 'f')) ||
        (hex_first == '5' && hex_second == 'c')) {
      return true;
    }
  }

  return false;
}

[[nodiscard]] bool IsSafeOsrmPathSuffix(const std::string_view path_suffix) {
  std::array<std::string_view, 4> segments{};
  std::size_t segment_count = 0U;
  std::size_t segment_start = 0U;

  while (segment_start <= path_suffix.size()) {
    const auto separator = path_suffix.find('/', segment_start);
    const auto segment_end = separator == std::string_view::npos ? path_suffix.size() : separator;
    const auto segment = path_suffix.substr(segment_start, segment_end - segment_start);

    if (segment.empty() || segment == "." || segment == ".." ||
        segment.find('\\') != std::string_view::npos || HasEncodedPathSeparatorOrDot(segment)) {
      return false;
    }
    if (segment_count >= segments.size()) {
      return false;
    }
    segments[segment_count] = segment;
    ++segment_count;

    if (separator == std::string_view::npos) {
      break;
    }
    segment_start = separator + 1U;
  }

  return segment_count == segments.size() && IsAllowedService(segments[0]) && segments[1] == "v1";
}

} // namespace

namespace deliveryoptimizer::api {

void RegisterOsrmProxyEndpoint(drogon::HttpAppFramework& app) {
  const auto osrm_base_url = ResolveNormalizedUrlEnvOrDefault("OSRM_URL", kDefaultOsrmBaseUrl);
  auto osrm_client = drogon::HttpClient::newHttpClient(osrm_base_url);

  app.registerHandlerViaRegex(
      "^/api/v1/osrm/(.+)$",
      [osrm_client =
           std::move(osrm_client)](const drogon::HttpRequestPtr& request,
                                   std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                   const std::string& path_suffix) mutable {
        const auto service_name = ResolveServiceName(path_suffix);
        if (!IsAllowedService(service_name)) {
          Json::Value body;
          body["error"] = "OSRM service not allowed.";
          auto response = drogon::HttpResponse::newHttpJsonResponse(body);
          response->setStatusCode(drogon::k403Forbidden);
          std::move(callback)(response);
          return;
        }

        if (!IsSafeOsrmPathSuffix(path_suffix)) {
          Json::Value body;
          body["error"] = "OSRM path not allowed.";
          auto response = drogon::HttpResponse::newHttpJsonResponse(body);
          response->setStatusCode(drogon::k403Forbidden);
          std::move(callback)(response);
          return;
        }

        auto upstream_request = drogon::HttpRequest::newHttpRequest();
        upstream_request->setMethod(drogon::Get);
        upstream_request->setPassThrough(true);

        const auto& query = request->query();
        const std::string path =
            query.empty() ? "/" + path_suffix : "/" + path_suffix + "?" + query;
        upstream_request->setPath(path);

        osrm_client->sendRequest(
            upstream_request,
            [callback = std::move(callback)](const drogon::ReqResult result,
                                             const drogon::HttpResponsePtr& response) mutable {
              if (result == drogon::ReqResult::Ok && response != nullptr) {
                std::move(callback)(response);
                return;
              }

              Json::Value body;
              body["error"] = "OSRM upstream request failed.";
              auto upstream_error = drogon::HttpResponse::newHttpJsonResponse(body);
              upstream_error->setStatusCode(drogon::k502BadGateway);
              std::move(callback)(upstream_error);
            });
      },
      {drogon::Get});
}

} // namespace deliveryoptimizer::api
