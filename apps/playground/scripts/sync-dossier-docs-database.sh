#!/bin/bash
DATABASE_SQLITE_FILE=./public/dossier-docs.sqlite npx ts-node -T --esm ../blog/scripts/sync-database-with-disk.ts --skip-updating-events-on-disk

