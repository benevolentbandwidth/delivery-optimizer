#pragma once

#include <json/json.h>

#include <optional>
#include <string_view>

namespace deliveryoptimizer::adapters {

[[nodiscard]] std::optional<Json::Value> ParseJsonText(std::string_view text);

} // namespace deliveryoptimizer::adapters
