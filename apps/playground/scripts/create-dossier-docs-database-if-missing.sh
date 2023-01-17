#!/bin/bash

if [ -f ./public/dossier-docs.sqlite ]; then
  echo "A dossier-docs database is already configured"
  exit 0
fi

npx ts-node -T --esm ../blog/scripts/create-database-from-disk.ts ./public/dossier-docs.sqlite 2>&1
