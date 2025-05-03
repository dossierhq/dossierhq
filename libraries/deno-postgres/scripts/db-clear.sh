#!/bin/bash

set -e -u

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"

(
  set -a
  source "$THIS_DIR/../.env"
  set +a
  echo "(Clearing database automatically, ignore "press return to proceed")"
  time yes | psql -s "$DATABASE_URL" -c 'DELETE FROM events; DELETE FROM entities; DELETE FROM schema_versions; DELETE FROM subjects;'
  echo "Done"
)
