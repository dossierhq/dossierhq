#!/bin/bash
set -e -u

THIS_DIR="$(cd "$(dirname "$0")" > /dev/null; pwd)"

(
  cd "$THIS_DIR/../../../"

  # find all package.json files (including root)
  PACKAGE_FILES="$(git ls-files | grep '\(^\|.*/\)package\.json$')"

  echo "$PACKAGE_FILES" | while read -r PACKAGE_FILE; do
    PROJECT_DIR="$(dirname "${PACKAGE_FILE}")"
    (
      set -x
      cd "${PROJECT_DIR}"
      npm "$@"
    )
  done

)
