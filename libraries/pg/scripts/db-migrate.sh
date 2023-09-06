#!/bin/bash

set -e -u

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"

(
  set -a
  source "$THIS_DIR/../.env"
  set +a
  npx dossier-pg-migrate $@
  env DATABASE_URL="$DATABASE_A_URL" npx dossier-pg-migrate $@
  env DATABASE_URL="$DATABASE_B_URL" npx dossier-pg-migrate $@
)
