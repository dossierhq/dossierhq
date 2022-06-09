import { CliAuth, CliContext, CliMain } from '@jonasb/datadata-cli';
import { AdminSchema, createConsoleLogger } from '@jonasb/datadata-core';
import { schemaSpecification } from './schema';
import { initializeServer } from './server';

const logger = createConsoleLogger(console);

async function main() {
  const serverResult = await initializeServer(logger);
  const server = serverResult.valueOrThrow();

  try {
    const sessionResult = await CliAuth.veryInsecureCreateSession(server, 'test', 'john-smith');
    if (sessionResult.isError()) throw sessionResult.toError();
    const { context } = sessionResult.value;
    const adminClient = server.createAdminClient(context);
    const schemaResult = await adminClient.updateSchemaSpecification(schemaSpecification);
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
