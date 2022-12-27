#!/bin/bash
# Wrapper for pgcli (`brew install pgcli`) to connect to the correct Postgres instance

set -e -u

(
  pgcli $HOST_ROOT_DATABASE_URL
)
