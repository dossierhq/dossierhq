import 'dotenv/config';
import { CliAuth, CliContext, CliMain } from '@jonasb/datadata-cli';
import { AdminSchema } from '@jonasb/datadata-core';
import SchemaSpec from './schema.json';
import { initializeServer } from './server';

async function main() {
  const serverResult = await initializeServer();
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
      schema: new AdminSchema(schemaResult.value.schemaSpecification),
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
