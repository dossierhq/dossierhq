#!/bin/bash

set -e -u

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"

(
  set -a
  source "$THIS_DIR/../.env"
  set +a
  time psql -s "$DATABASE_URL" -c 'SELECT COUNT(*) FROM entities; DELETE FROM entities; DELETE FROM schema_versions;'
)
