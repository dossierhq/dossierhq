#!/usr/bin/env npx ts-node
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import { CliAuth, CliContext, CliMain } from '@datadata/cli';
import type { SchemaSpecification } from '@datadata/core';
import { Schema } from '@datadata/core';
import { createServerAdminClient, createServerPublishedClient, Session } from '@datadata/server';
import { Server } from '@datadata/server';
import SchemaSpec from './schema.json';

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const server = new Server({ databaseUrl: process.env.DATABASE_URL! });
  try {
    let session: Session | null = null;
    while (!session) {
      session = await CliAuth.veryInsecureCreateSession(server, 'test', 'john-smith');
    }
    const context = server.createSessionContext(session);
    const schema = new Schema(SchemaSpec as SchemaSpecification);
    const loadSchema = await server.setSchema(context, schema);
    loadSchema.throwIfError();

    const cliContext: CliContext = {
      schema,
      adminClient: createServerAdminClient({ resolveContext: () => Promise.resolve(context) }),
      publishedClient: createServerPublishedClient({
        resolveContext: () => Promise.resolve(context),
      }),
    };

    await CliMain.mainMenu(cliContext);
  } finally {
    await server.shutdown();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.warn(error);
    process.exitCode = 1;
  });
}
