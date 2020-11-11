#!/bin/bash
# Ensures that all test databases exist

set -e -u

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"

function exec_in_container {
  docker-compose -p "${DOCKER_PROJECT_NAME}" exec -T "${DOCKER_POSTGRES_SERVICE}" "$@"
}

function psql_in_container {
  exec_in_container psql -d "$DATABASE_URL" "$@"
}

function create_user {
  USERNAME="$1"
  PASSWORD="$2"
  psql_in_container <<EOF
SELECT 'CREATE USER ${USERNAME} WITH PASSWORD ''${PASSWORD}''' WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${USERNAME}')
\gexec
EOF
}

function create_database {
  DATABASE_NAME="$1"
  psql_in_container <<EOF
SELECT 'CREATE DATABASE "${DATABASE_NAME}"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DATABASE_NAME}')
\gexec
EOF
}

function grant_access_for_user {
  DATABASE_NAME="$1"
  USERNAME="$2"
  psql_in_container -c "GRANT CREATE ON DATABASE \"${DATABASE_NAME}\" TO ${USERNAME}"
}

(
  set -a
  source "$THIS_DIR/../.env"
  set +a
  create_user "examplesfoouser" "examplesfoopass"
  create_database "datadata-examples-foo"
  grant_access_for_user "datadata-examples-foo" "examplesfoouser"
)
