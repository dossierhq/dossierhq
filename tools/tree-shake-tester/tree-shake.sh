set -eu

function tree_shake() {
  INFILE=$1
  OUTFILE=${INFILE%.*}-out.${INFILE##*.}
  ARGS=${@:2}
  (
  npx esbuild --bundle "$INFILE" --outfile="$OUTFILE" --analyze=verbose --tree-shaking=true $ARGS 2>&1
  )
}

tree_shake test-cases/better-sqlite3-empty.js --platform=node
tree_shake test-cases/core-empty.js
tree_shake test-cases/design-empty.js
tree_shake test-cases/react-components-empty.js
tree_shake test-cases/server-empty.js
