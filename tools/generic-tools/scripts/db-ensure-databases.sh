#!/bin/bash
# Ensures that all test databases exist

set -e -u

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"

function create_user {
  USERNAME="$1"
  PASSWORD="$2"
  echo "Creating user $USERNAME"
  "$THIS_DIR/db-psql-root.sh" <<EOF
SELECT 'CREATE USER ${USERNAME} WITH PASSWORD ''${PASSWORD}''' WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${USERNAME}')
\gexec
EOF
}

function create_database {
  DATABASE_NAME="$1"
  echo "Creating databse $DATABASE_NAME"
  "$THIS_DIR/db-psql-root.sh" <<EOF
SELECT 'CREATE DATABASE "${DATABASE_NAME}"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DATABASE_NAME}')
\gexec
EOF
}

function grant_access_for_user {
  DATABASE_NAME="$1"
  USERNAME="$2"
  "$THIS_DIR/db-psql-root.sh" -c "GRANT CREATE ON DATABASE \"${DATABASE_NAME}\" TO ${USERNAME}"
}

(
  set -a
  source "$THIS_DIR/../.env"
  set +a

  create_user "librariespguser" "librariespgpass"
  create_database "datadata-libraries-pg"
  grant_access_for_user "datadata-libraries-pg" "librariespguser"

  create_user "examplesbenchmarkuser" "examplesbenchmarkpass"
  create_database "datadata-examples-benchmark"
  grant_access_for_user "datadata-examples-benchmark" "examplesbenchmarkuser"

  create_user "examplesdenouser" "examplesdenopass"
  create_database "datadata-examples-deno"
  grant_access_for_user "datadata-examples-deno" "examplesdenouser"

  create_user "examplesnextwebuser" "examplesnextwebpass"
  create_database "datadata-examples-next-web"
  grant_access_for_user "datadata-examples-next-web" "examplesnextwebuser"

  create_user "librariesdenouser" "librariesdenopass"
  create_database "datadata-libraries-deno"
  grant_access_for_user "datadata-libraries-deno" "librariesdenouser"
)
