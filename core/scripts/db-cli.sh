#!/bin/bash
# Wrapper for pgcli (`brew install pgcli`) to connect to the correct Postgres instance

set -e -u

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"

(
  set -a
  source "$THIS_DIR/../.env"
  set +a
  pgcli "$DATABASE_URL"
)
