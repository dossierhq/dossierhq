#!/usr/bin/env npx ts-node
import 'dotenv/config';
import { CliAuth, CliContext, CliMain } from '@jonasb/datadata-cli';
import type { SchemaSpecification } from '@jonasb/datadata-core';
import { Schema } from '@jonasb/datadata-core';
import {
  createServerAdminClient,
  createServerPublishedClient,
  Server,
} from '@jonasb/datadata-server';
import type { Session } from '@jonasb/datadata-server';
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
