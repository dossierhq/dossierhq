#!/usr/bin/env bash
set -eu

function bundle_esbuild() {
  INFILE=$1
  OUTFILE=${INFILE%.*}-esbuild.${INFILE##*.}
  ARGS=${@:2}
  npx esbuild --bundle "$INFILE" --outfile="$OUTFILE" --analyze=verbose --tree-shaking=true $ARGS 2>&1
}

function bundle_rollup {
  INFILE=$1
  OUTFILE=${INFILE%.*}-rollup.${INFILE##*.}
  ARGS=${@:2}
  npx rollup "$INFILE" --config rollup.config.js --file "$OUTFILE" --format iife -p @rollup/plugin-node-resolve $ARGS 2>&1
}

rm test-cases/*-esbuild.js || true
rm test-cases/*-rollup.js || true

bundle_esbuild test-cases/better-sqlite3-empty.js --platform=node
bundle_esbuild test-cases/core-empty.js
bundle_esbuild test-cases/design-empty.js
bundle_esbuild test-cases/graphql-empty.js
bundle_esbuild test-cases/react-components-empty.js
bundle_esbuild test-cases/server-empty.js

bundle_rollup test-cases/better-sqlite3-empty.js
bundle_rollup test-cases/core-empty.js
bundle_rollup test-cases/design-empty.js -p @rollup/plugin-commonjs
bundle_rollup test-cases/graphql-empty.js -p @rollup/plugin-commonjs
bundle_rollup test-cases/react-components-empty.js -p @rollup/plugin-commonjs
bundle_rollup test-cases/server-empty.js
