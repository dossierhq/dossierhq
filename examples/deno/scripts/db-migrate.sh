#!/bin/bash

set -e -u

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"

(
  set -a
  source "$THIS_DIR/../.env"
  set +a
  env DATABASE_URL="$EXAMPLES_DENO_DATABASE_URL" npx dossier-pg-migrate "$@"
)
