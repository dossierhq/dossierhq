#!/bin/bash
DATABASE_SQLITE_FILE=./public/dossier-docs.sqlite ../blog/scripts/sync-database-with-disk.ts --skip-updating-events-on-disk
