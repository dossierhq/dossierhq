#!/bin/bash

if [ -f .env.local ] && grep -q "DATABASE_SQLITE_FILE" .env.local; then
  echo "A database is already configured"
  exit 0
fi

echo "DATABASE_SQLITE_FILE=data/database.sqlite" >> .env.local
npx ts-node -T --esm ./scripts/create-database-from-disk.ts data/database.sqlite 2>&1
