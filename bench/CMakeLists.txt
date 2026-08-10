find_package(Drogon CONFIG REQUIRED)
find_package(jsoncpp CONFIG REQUIRED)

add_executable(deliveryoptimizer_alloc_bench allocation_bench.cpp)
target_compile_features(deliveryoptimizer_alloc_bench PRIVATE cxx_std_20)
target_include_directories(
  deliveryoptimizer_alloc_bench
  PRIVATE "${CMAKE_SOURCE_DIR}/app/api/include"
)
target_link_libraries(
  deliveryoptimizer_alloc_bench
  PRIVATE
    deliveryoptimizer_api_runtime
    Drogon::Drogon
    JsonCpp::JsonCpp
)

if(DELIVERYOPTIMIZER_ENABLE_WARNINGS)
  deliveryoptimizer_set_warnings(deliveryoptimizer_alloc_bench)
endif()
