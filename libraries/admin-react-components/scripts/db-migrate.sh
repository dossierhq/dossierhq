#!/bin/bash

set -e -u

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"

(
  set -a
  source "$THIS_DIR/../.env"
  set +a
  env DATABASE_URL="$STORYBOOK_ADMIN_REACT_COMPONENTS_DATABASE_URL" npx datadata-pg-migrate $@
)
