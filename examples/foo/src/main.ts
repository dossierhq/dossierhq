#!/usr/bin/env npx ts-node
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import { CliAuth } from '@datadata/cli';
import type { Session } from '@datadata/core';
import { Instance } from '@datadata/core';

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const instance = new Instance({ databaseUrl: process.env.DATABASE_URL! });
  try {
    let session: Session | null = null;
    while (!session) {
      session = await CliAuth.veryInsecureCreateSession(instance, 'test', 'john-smith');
    }
    const context = instance.createSessionContext(session);
    await instance.reloadSchema(context);
  } finally {
    await instance.shutdown();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.warn(error);
    process.exitCode = 1;
  });
}
