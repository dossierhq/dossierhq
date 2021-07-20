import 'dotenv/config';
import type { CliContext } from '@jonasb/datadata-cli';
import { CliAuth, CliMain } from '@jonasb/datadata-cli';
import type { Session } from '@jonasb/datadata-server';
import { createServerAdminClient, createServerPublishedClient } from '@jonasb/datadata-server';
import { getServerConnection } from './utils/ServerUtils';

async function main() {
  const { server } = await getServerConnection();
  try {
    let session: Session | null = null;
    while (!session) {
      session = await CliAuth.veryInsecureCreateSession(server, 'test', 'john-smith');
    }
    const schema = server.getSchema();
    const context = server.createSessionContext(session);
    const adminClient = createServerAdminClient({ context });
    const publishedClient = createServerPublishedClient({ context });

    const cliContext: CliContext = {
      schema,
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
