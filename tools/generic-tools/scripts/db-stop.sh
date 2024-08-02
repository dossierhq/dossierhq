#!/bin/bash
set -e -u

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"

(
  set -a
  source "$THIS_DIR/../.env"
  set +a
  cd "$THIS_DIR/.."
  docker compose -p "$DOCKER_PROJECT_NAME" down
)
