#!/usr/bin/env python3
"""Validate that PR descriptions contain the high-signal template fields."""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path


REQUIRED_SECTIONS = (
    "Summary",
    "Motivation",
    "Changes",
    "Validation",
    "Risk",
    "Rollout and Recovery",
)

PLACEHOLDER_PATTERNS = (
    re.compile(r"^\s*-\s*$", re.MULTILINE),
    re.compile(r"\b(tbd|todo|n/a|none)\b", re.IGNORECASE),
)


def main() -> int:
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        print("GITHUB_EVENT_PATH is not set.", file=sys.stderr)
        return 1

    event = json.loads(Path(event_path).read_text(encoding="utf-8"))
    body = (event.get("pull_request") or {}).get("body") or ""
    errors = validate_body(body)

    if errors:
        print("PR description is missing required high-signal content:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("PR description has the required high-signal sections.")
    return 0


def validate_body(body: str) -> list[str]:
    errors: list[str] = []
    sections = parse_sections(body)

    for section in REQUIRED_SECTIONS:
        content = sections.get(section)
        if content is None:
            errors.append(f"Missing section: {section}")
            continue
        if not has_signal(content):
            errors.append(f"Section needs real content: {section}")

    validation = sections.get("Validation", "")
    if validation and not re.search(r"^\s*-\s*\[[xX]\]\s+`[^`]+`", validation, re.MULTILINE):
        errors.append("Validation must include at least one checked command checkbox.")

    return errors


def parse_sections(body: str) -> dict[str, str]:
    matches = list(re.finditer(r"^##\s+(.+?)\s*$", body, re.MULTILINE))
    sections: dict[str, str] = {}

    for index, match in enumerate(matches):
        heading = match.group(1).strip()
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(body)
        sections[heading] = body[start:end].strip()

    return sections


def has_signal(content: str) -> bool:
    normalized = content.strip()
    if len(normalized) < 8:
        return False
    return not any(pattern.search(normalized) for pattern in PLACEHOLDER_PATTERNS)


if __name__ == "__main__":
    raise SystemExit(main())
