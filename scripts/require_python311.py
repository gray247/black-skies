"""Fail early when a validation command is not using the supported Python baseline."""

from __future__ import annotations

import sys


def main() -> int:
    if sys.version_info[:2] == (3, 11):
        print(f"Python baseline satisfied: {sys.version.split()[0]}")
        return 0
    print(
        "Black Skies validation requires Python 3.11 exactly; "
        f"received {sys.version.split()[0]}. Install Python 3.11 and invoke it explicitly.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
