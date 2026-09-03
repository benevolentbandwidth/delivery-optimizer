#pragma once

#include <charconv>
#include <concepts>
#include <cstddef>
#include <cstdint>
#include <json/json.h>
#include <string>
#include <string_view>
#include <type_traits>

namespace deliveryoptimizer::api::internal {

inline std::string RenderJson(const Json::Value& value) {
  static const Json::StreamWriterBuilder kWriterBuilder = [] {
    Json::StreamWriterBuilder builder;
    builder["indentation"] = "";
    builder["commentStyle"] = "None";
    return builder;
  }();
  return Json::writeString(kWriterBuilder, value);
}

[[nodiscard]] inline std::size_t EscapedJsonStringSize(const std::string_view value) {
  std::size_t size = 2U; // Opening and closing quotes.
  for (const char character : value) {
    switch (character) {
    case '"':
    case '\\':
    case '\b':
    case '\f':
    case '\n':
    case '\r':
    case '\t':
      size += 2U;
      break;
    default:
      size += static_cast<unsigned char>(character) < 0x20U ? 6U : 1U;
      break;
    }
  }
  return size;
}

inline void AppendEscapedJsonString(std::string& output, const std::string_view value) {
  output.push_back('"');
  for (const char character : value) {
    switch (character) {
    case '"':
      output += "\\\"";
      break;
    case '\\':
      output += "\\\\";
      break;
    case '\b':
      output += "\\b";
      break;
    case '\f':
      output += "\\f";
      break;
    case '\n':
      output += "\\n";
      break;
    case '\r':
      output += "\\r";
      break;
    case '\t':
      output += "\\t";
      break;
    default:
      if (static_cast<unsigned char>(character) < 0x20U) {
        constexpr char kHexDigits[] = "0123456789abcdef";
        const auto byte = static_cast<unsigned char>(character);
        output += "\\u00";
        output.push_back(kHexDigits[(byte >> 4U) & 0x0FU]);
        output.push_back(kHexDigits[byte & 0x0FU]);
      } else {
        output.push_back(character);
      }
      break;
    }
  }
  output.push_back('"');
}

template <std::integral Integer>
inline void AppendJsonInteger(std::string& output, const Integer value) {
  using Widened = std::conditional_t<std::is_signed_v<Integer>, std::int64_t, std::uint64_t>;
  const auto widened = static_cast<Widened>(value);
  char buffer[32];
  const auto [end, error] = std::to_chars(buffer, buffer + sizeof(buffer), widened);
  if (error == std::errc{}) {
    output.append(buffer, end);
  }
}

inline void AppendJsonField(std::string& output, const std::string_view name,
                            const std::string_view value) {
  output += ",\"";
  output.append(name);
  output += "\":";
  AppendEscapedJsonString(output, value);
}

template <std::integral Integer>
inline void AppendJsonField(std::string& output, const std::string_view name, const Integer value) {
  output += ",\"";
  output.append(name);
  output += "\":";
  AppendJsonInteger(output, value);
}

} // namespace deliveryoptimizer::api::internal
