#!/bin/bash
DATABASE_SQLITE_FILE=./public/dossier-docs.sqlite node ../blog/scripts/sync-database-with-disk.ts --update-db-only --fts-4

