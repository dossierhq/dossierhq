#!/bin/bash
# Set users to superuser/nosuperuser

set -e -u

THIS_DIR="$(pushd "$(dirname "$0")" > /dev/null; pwd; popd > /dev/null)"

function set_user_superuser {
  USERNAME="$1"
  SUPER_OR_NO_SUPERUSER="$2"
  if [[ "$SUPER_OR_NO_SUPERUSER" == "superuser" ]]; then
    "$THIS_DIR/db-psql-root.sh" -c "ALTER USER ${USERNAME} WITH SUPERUSER"
  elif [[ "$SUPER_OR_NO_SUPERUSER" == "no-superuser" ]]; then
    "$THIS_DIR/db-psql-root.sh" -c "ALTER USER ${USERNAME} WITH NOSUPERUSER"
  else
    >&2 echo "Expected superuser or nosuperuser, got ${SUPER_OR_NO_SUPERUSER}"
  fi
}

(
  set -a
  source "$THIS_DIR/../.env"
  set +a

  SUPER_OR_NO_SUPERUSER="$1"

  # Usernames must match those in ./db-ensure-databases.sh
  set_user_superuser "dossierbenchmarkuser" "$SUPER_OR_NO_SUPERUSER"
  set_user_superuser "dossierdenouser" "$SUPER_OR_NO_SUPERUSER"
  set_user_superuser "dossierexampledenouser" "$SUPER_OR_NO_SUPERUSER"
  set_user_superuser "dossierpguser" "$SUPER_OR_NO_SUPERUSER"
  set_user_superuser "dossierpgauser" "$SUPER_OR_NO_SUPERUSER"
  set_user_superuser "dossierpgbuser" "$SUPER_OR_NO_SUPERUSER"
)
