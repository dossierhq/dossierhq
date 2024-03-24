#!/bin/bash

curl -X POST \
  -H "Content-Type: application/json" -H "insecure-auth-provider: test" -H "insecure-auth-identifier: john-smith" \
  -d '{"query": "mutation { createBlogPostEntity(entity: { info: { name: \"Blog post\" }, fields: {}}) { effect entity { id info { name } } } }" }' \
  http://localhost:4000/graphql
