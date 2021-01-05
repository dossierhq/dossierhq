#!/usr/bin/env npx ts-node
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import { CliAuth, CliMain } from '@datadata/cli';
import type { SchemaSpecification } from '@datadata/core';
import { Schema } from '@datadata/core';
import type { Session } from '@datadata/server';
import { Instance } from '@datadata/server';
import SchemaSpec from './schema.json';

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const instance = new Instance({ databaseUrl: process.env.DATABASE_URL! });
  try {
    let session: Session | null = null;
    while (!session) {
      session = await CliAuth.veryInsecureCreateSession(instance, 'test', 'john-smith');
    }
    const context = instance.createSessionContext(session);
    const loadSchema = await instance.setSchema(
      context,
      new Schema(SchemaSpec as SchemaSpecification)
    );
    loadSchema.throwIfError();

    await CliMain.mainMenu(context);
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
