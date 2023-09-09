#!/bin/bash

curl -X POST \
  -H "Content-Type: application/json" -H "insecure-auth-provider: test" -H "insecure-auth-identifier: john-smith" \
  -d '{"query": "query { adminEntitiesSample { items { id info { type name } } } }" }' \
  http://localhost:4000/graphql
