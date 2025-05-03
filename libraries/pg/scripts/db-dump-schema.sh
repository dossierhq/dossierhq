#!/bin/bash
set -e -u -o pipefail

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"
DOCKER_PROJECT_NAME=dossier
DOCKER_POSTGRES_SERVICE=postgres

function exec_in_container {
  docker compose -p "${DOCKER_PROJECT_NAME}" exec -T "${DOCKER_POSTGRES_SERVICE}" "$@"
}

function _in_container {
  exec_in_container pg_dump -d "$DOCKER_ROOT_DATABASE_URL" "$@"
}


function exec_pg_dump {
  if [ -n "${HOST_ROOT_DATABASE_URL+x}" ]; then
    pg_dump "$@"
  else
    exec_in_container pg_dump "$@"
  fi
}


(
  set -a
  source "$THIS_DIR/../.env"
  set +a

  exec_pg_dump -s "$DATABASE_URL" --no-owner --no-comments | sed -e '/^--/d' | sed -e '/^$/N;/^\n$/D' > "$THIS_DIR/../docs/schema.sql"
)
