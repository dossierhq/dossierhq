#!/bin/bash
# Ensures that all test databases exist

set -e -u

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"

function exec_in_container {
  docker-compose -p "${DOCKER_PROJECT_NAME}" exec -T "${DOCKER_POSTGRES_SERVICE}" "$@"
}

function psql_in_container {
  exec_in_container psql -d "$DOCKER_ROOT_DATABASE_URL" "$@"
}

function psql_in_host {
  psql -d "$HOST_ROOT_DATABASE_URL" "$@"
}

function psql_somewhere {
  if [ -n "${HOST_ROOT_DATABASE_URL+x}" ]; then
    psql_in_host "$@"
  else
    psql_in_container "$@"
  fi
}

function create_user {
  USERNAME="$1"
  PASSWORD="$2"
  psql_somewhere <<EOF
SELECT 'CREATE USER ${USERNAME} WITH PASSWORD ''${PASSWORD}''' WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${USERNAME}')
\gexec
EOF
}

function create_database {
  DATABASE_NAME="$1"
  psql_somewhere <<EOF
SELECT 'CREATE DATABASE "${DATABASE_NAME}"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DATABASE_NAME}')
\gexec
EOF
}

function grant_access_for_user {
  DATABASE_NAME="$1"
  USERNAME="$2"
  psql_somewhere -c "GRANT CREATE ON DATABASE \"${DATABASE_NAME}\" TO ${USERNAME}"
}

(
  set -a
  source "$THIS_DIR/../.env"
  set +a

  create_user "servertestuser" "servertestpass"
  create_database "datadata-server"
  grant_access_for_user "datadata-server" "servertestuser"

  create_user "examplesdenouser" "examplesdenopass"
  create_database "datadata-examples-deno"
  grant_access_for_user "datadata-examples-deno" "examplesdenouser"

  create_user "examplesfoouser" "examplesfoopass"
  create_database "datadata-examples-foo"
  grant_access_for_user "datadata-examples-foo" "examplesfoouser"

  create_user "examplesnextwebuser" "examplesnextwebpass"
  create_database "datadata-examples-next-web"
  grant_access_for_user "datadata-examples-next-web" "examplesnextwebuser"

  create_user "graphqltestuser" "graphqltestpass"
  create_database "datadata-graphql"
  grant_access_for_user "datadata-graphql" "graphqltestuser"
)
