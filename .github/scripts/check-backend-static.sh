#!/usr/bin/env bash
set -euo pipefail

build_dir="${1:-build/dev}"

mapfile -t backend_cpp_files < <(
  find app/api libs tests -type f \( -name '*.cpp' -o -name '*.cc' -o -name '*.cxx' \) | sort
)
mapfile -t backend_cxx_files < <(
  find app/api libs tests -type f \( -name '*.cpp' -o -name '*.cc' -o -name '*.cxx' -o -name '*.hpp' -o -name '*.hh' -o -name '*.hxx' -o -name '*.h' \) | sort
)

if ((${#backend_cxx_files[@]} == 0)); then
  echo "No backend C++ files found."
  exit 0
fi

echo "Checking backend format..."
clang-format --dry-run --Werror "${backend_cxx_files[@]}"

if ((${#backend_cpp_files[@]} == 0)); then
  echo "No backend translation units found for clang-tidy/clangd."
  exit 0
fi

echo "Checking backend lint with clang-tidy..."
clang-tidy -p "$build_dir" "${backend_cpp_files[@]}"

echo "Checking backend LSP diagnostics with clangd..."
for source in "${backend_cpp_files[@]}"; do
  # clangd 18's ExtractFunction tweak can report internal, non-diagnostic
  # failures for valid control-flow while running --check. Keep the LSP parse
  # diagnostics enabled, but skip that flaky tweak in CI.
  clangd --check="$source" --compile-commands-dir="$build_dir" --tweaks=-ExtractFunction
done
