#include "deliveryoptimizer/adapters/json_utils.hpp"

#include <memory>

namespace deliveryoptimizer::adapters {

std::optional<Json::Value> ParseJsonText(const std::string_view text) {
  Json::CharReaderBuilder builder;
  builder["collectComments"] = false;

  Json::Value root;
  JSONCPP_STRING errors;
  std::unique_ptr<Json::CharReader> reader{builder.newCharReader()};
  const char* begin = text.data();
  const char* end = begin + text.size();
  if (!reader->parse(begin, end, &root, &errors)) {
    return std::nullopt;
  }

  return root;
}

} // namespace deliveryoptimizer::adapters
