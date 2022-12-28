#!/bin/bash

function psql_in_host {
  psql -d "$HOST_ROOT_DATABASE_URL" "$@"
}

psql_in_host "$@"
