#!/bin/bash

if [ -f ./public/datadata-docs.sqlite ]; then
  echo "A datdata-docs database is already configured"
  exit 0
fi

npx ts-node -T --esm ../blog/scripts/create-database-from-disk.ts ./public/datadata-docs.sqlite 2>&1
