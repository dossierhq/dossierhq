#!/bin/bash

if [ -f .env ] && grep -q "DATABASE_SQLITE_FILE" .env; then
  echo "A database is already configured"
  exit 0
fi

echo "DATABASE_SQLITE_FILE=data/database.sqlite" >> .env
./scripts/create-database-from-disk.ts data/database.sqlite 2>&1
