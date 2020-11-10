#!/usr/bin/env npx ts-node
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import { Auth, Instance } from '@datadata/core';

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const instance = new Instance({ databaseUrl: process.env.DATABASE_URL! });
  try {
    const authSession = instance.createAuthContext();
    const session = await Auth.createSessionForPrincipal(authSession, 'a', 'b');
    const context = instance.createSessionContext(session);
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
