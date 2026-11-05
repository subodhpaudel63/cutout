#!/bin/sh
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  python3 launch.py
else
  echo "Python 3.9 or newer is required: https://www.python.org/downloads/"
  read -r _
fi
