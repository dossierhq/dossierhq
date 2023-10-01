#!/bin/bash
DATABASE_SQLITE_FILE=./public/dossier-docs.sqlite npx ts-node -T --esm ../blog/scripts/sync-database-with-disk.ts --update-db-only

