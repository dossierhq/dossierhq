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

function ensure_database {
  DATABASE_NAME="$1"
  USER_NAME="$2"
  PASSWORD="$3"

  create_user "$USER_NAME" "$PASSWORD"
  create_database "$DATABASE_NAME"
  grant_access_for_user "$DATABASE_NAME" "$USER_NAME"
}

(
  set -a
  source "$THIS_DIR/../.env"
  set +a

  # Usernames must match those in ./db-make-superuser.sh
  ensure_database "dossier-benchmark" "dossierbenchmarkuser" "dossierbenchmarkpass"
  ensure_database "dossier-deno" "dossierdenouser" "dossierdenopass"
  ensure_database "dossier-example-deno" "dossierexampledenouser" "dossierexampledenopass"
  ensure_database "dossier-example-next" "dossierexamplenextuser" "dossierexamplenextpass"
  ensure_database "dossier-pg" "dossierpguser" "dossierpgpass"
)
