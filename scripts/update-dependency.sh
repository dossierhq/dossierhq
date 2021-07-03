#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

SED=gsed

PACKAGE_NAME="$1"
PACKAGE_NEW_VERSION="$2"

SED_EXPRESSION="s/\"$PACKAGE_NAME\": \"[^\"]\\+\"/\"$PACKAGE_NAME\": \"$PACKAGE_NEW_VERSION\"/"

# find all package.json files (including root)
PACKAGE_FILES="$(git ls-files | grep '\(^\|.*/\)package\.json$')"

echo "This will change the following lines:"
echo "$PACKAGE_FILES" | while read -r PACKAGE_FILE; do
  PROJECT_DIR="$(dirname "${PACKAGE_FILE}")"
  (
    set -x
    cd "${PROJECT_DIR}"
    $SED -n "${SED_EXPRESSION}p" package.json
  )
done

read -p "Are you sure? " -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "$PACKAGE_FILES" | while read -r PACKAGE_FILE; do
    PROJECT_DIR="$(dirname "${PACKAGE_FILE}")"
    (
      set -x
      cd "${PROJECT_DIR}"
      $SED "${SED_EXPRESSION}" -i package.json
    )
  done
fi

echo "Remember to run: rush check && rush update"
