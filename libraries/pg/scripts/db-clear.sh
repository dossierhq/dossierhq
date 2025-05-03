#!/bin/bash

set -e -u

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"

(
  set -a
  source "$THIS_DIR/../.env"
  set +a
  echo "(Clearing database 1/3 automatically, ignore "press return to proceed")"
  time yes | psql -s "$DATABASE_URL" -c 'DELETE FROM events; DELETE FROM entities; DELETE FROM schema_versions; DELETE FROM subjects;'
  echo "(Clearing database 2/3 automatically, ignore "press return to proceed")"
  time yes | psql -s "$DATABASE_A_URL" -c 'DELETE FROM events; DELETE FROM entities; DELETE FROM schema_versions; DELETE FROM subjects;'
  echo "(Clearing database 3/3 automatically, ignore "press return to proceed")"
  time yes | psql -s "$DATABASE_B_URL" -c 'DELETE FROM events; DELETE FROM entities; DELETE FROM schema_versions; DELETE FROM subjects;'
  echo "Done"
)
