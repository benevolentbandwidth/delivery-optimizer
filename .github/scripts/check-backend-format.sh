#!/usr/bin/env bash
set -euo pipefail

if (($# == 0)); then
  echo "usage: $0 <source> [<source> ...]" >&2
  exit 1
fi

clang-format --dry-run --Werror "$@"
