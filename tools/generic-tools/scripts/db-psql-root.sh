#!/bin/bash

function exec_in_container {
  docker compose -p "${DOCKER_PROJECT_NAME}" exec -T "${DOCKER_POSTGRES_SERVICE}" "$@"
}

function psql_in_container {
  exec_in_container psql -d "$DOCKER_ROOT_DATABASE_URL" "$@"
}

function psql_in_host {
  psql -d "$HOST_ROOT_DATABASE_URL" "$@"
}


if [ -n "${HOST_ROOT_DATABASE_URL+x}" ]; then
  psql_in_host "$@"
else
  psql_in_container "$@"
fi
