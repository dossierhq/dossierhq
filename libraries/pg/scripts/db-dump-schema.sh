#!/bin/bash
set -e -u

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"

(
  set -a
  source "$THIS_DIR/../.env"
  set +a
  pg_dump -s "$DATABASE_URL" --no-owner --no-comments | sed -e '/^--/d' | sed -e '/^$/N;/^\n$/D' > "$THIS_DIR/../docs/schema.sql"
)
