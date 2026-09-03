#include "deliveryoptimizer/adapters/json_utils.hpp"

#include <memory>
#include <string_view>

namespace deliveryoptimizer::adapters {

std::optional<Json::Value> ParseJsonText(const std::string_view text) {
  // The reader configuration is fixed, and jsoncpp's CharReader::parse() resets
  // its internal state (nodes_, comments_, errors_) at entry, so a single reader
  // per thread is safely reusable across parses.
  static const Json::CharReaderBuilder kBuilder = [] {
    Json::CharReaderBuilder builder;
    builder["collectComments"] = false;
    return builder;
  }();
  thread_local std::unique_ptr<Json::CharReader> reader{kBuilder.newCharReader()};

  Json::Value root;
  JSONCPP_STRING errors;
  const char* begin = text.data();
  const char* end = begin + text.size();
  if (!reader->parse(begin, end, &root, &errors)) {
    return std::nullopt;
  }

  return root;
}

} // namespace deliveryoptimizer::adapters
