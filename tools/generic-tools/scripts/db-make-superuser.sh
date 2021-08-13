#!/bin/bash
# Set users to superuser/nosuperuser

set -e -u

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"

function exec_in_container {
  docker-compose -p "${DOCKER_PROJECT_NAME}" exec -T "${DOCKER_POSTGRES_SERVICE}" "$@"
}

function psql_in_container {
  exec_in_container psql -d "$DATABASE_URL" "$@"
}

function set_user_superuser {
  USERNAME="$1"
  SUPER_OR_NO_SUPERUSER="$2"
  if [[ "$SUPER_OR_NO_SUPERUSER" == "superuser" ]]; then
    psql_in_container -c "ALTER USER ${USERNAME} WITH SUPERUSER"
  elif [[ "$SUPER_OR_NO_SUPERUSER" == "no-superuser" ]]; then
    psql_in_container -c "ALTER USER ${USERNAME} WITH NOSUPERUSER"
  else
    >&2 echo "Expected superuser or nosuperuser, got ${SUPER_OR_NO_SUPERUSER}"
  fi
}

(
  set -a
  source "$THIS_DIR/../.env"
  set +a

  SUPER_OR_NO_SUPERUSER="$1"

  set_user_superuser "servertestuser" "$SUPER_OR_NO_SUPERUSER"
  set_user_superuser "examplesfoouser" "$SUPER_OR_NO_SUPERUSER"
  set_user_superuser "examplesnextwebuser" "$SUPER_OR_NO_SUPERUSER"
  set_user_superuser "graphqltestuser" "$SUPER_OR_NO_SUPERUSER"
)
