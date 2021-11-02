import 'dotenv/config';
import { CliAuth, CliContext, CliMain } from '@jonasb/datadata-cli';
import { Schema } from '@jonasb/datadata-core';
import { createPostgresAdapter } from '@jonasb/datadata-database-adapter-postgres-pg';
import { createServer } from '@jonasb/datadata-server';
import SchemaSpec from './schema.json';

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const databaseAdapter = createPostgresAdapter({ connectionString: process.env.DATABASE_URL! });
  const serverResult = await createServer({ databaseAdapter });
  if (serverResult.isError()) throw serverResult.toError();
  const server = serverResult.value;
  try {
    const sessionResult = await CliAuth.veryInsecureCreateSession(server, 'test', 'john-smith');
    if (sessionResult.isError()) throw sessionResult.toError();
    const { context } = sessionResult.value;
    const adminClient = server.createAdminClient(context);
    const schemaResult = await adminClient.updateSchemaSpecification(SchemaSpec);
    if (schemaResult.isError()) throw schemaResult.toError();

    const cliContext: CliContext = {
      schema: new Schema(schemaResult.value.schemaSpecification),
      adminClient,
      publishedClient: server.createPublishedClient(context),
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
