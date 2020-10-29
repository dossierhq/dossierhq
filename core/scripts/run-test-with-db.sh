#!/bin/bash
set -e -u

function cleanup {
  npm run test:db:down
}

trap cleanup EXIT


npm run test:db:wait
npm run test:db:migrate
npx jest "$@"
