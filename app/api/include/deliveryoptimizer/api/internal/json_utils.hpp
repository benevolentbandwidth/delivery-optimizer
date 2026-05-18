#pragma once

#include <json/json.h>
#include <string>

namespace deliveryoptimizer::api::internal {

inline std::string RenderJson(const Json::Value& value) {
  Json::StreamWriterBuilder writer_builder;
  writer_builder["indentation"] = "";
  writer_builder["commentStyle"] = "None";
  return Json::writeString(writer_builder, value);
}

} // namespace deliveryoptimizer::api::internal
