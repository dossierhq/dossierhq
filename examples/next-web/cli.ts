import 'dotenv/config';
import type { CliContext } from '@jonasb/datadata-cli';
import { CliAuth, CliMain } from '@jonasb/datadata-cli';
import { AdminSchema } from '@jonasb/datadata-core';
import { getServerConnection } from './utils/ServerUtils';

async function main() {
  const { server } = await getServerConnection();
  try {
    const sessionResult = await CliAuth.veryInsecureCreateSession(server, 'test', 'john-smith');
    if (sessionResult.isError()) throw sessionResult.toError();
    const { context } = sessionResult.value;
    const adminClient = server.createAdminClient(context);
    const publishedClient = server.createPublishedClient(context);
    const schemaResult = await adminClient.getSchemaSpecification();
    if (schemaResult.isError()) {
      throw schemaResult.toError();
    }

    const cliContext: CliContext = {
      schema: new AdminSchema(schemaResult.value),
      adminClient,
      publishedClient,
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
