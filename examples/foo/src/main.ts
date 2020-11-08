#!/usr/bin/env npx ts-node
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

async function main() {
  console.log('Done.');
}

if (require.main === module) {
  main().catch((error) => {
    console.warn(error);
    process.exitCode = 1;
  });
}
