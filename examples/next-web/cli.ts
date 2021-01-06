import 'dotenv/config';
import { CliAuth, CliMain } from '@datadata/cli';
import type { Session } from '@datadata/server';
import { getServerConnection } from './utils/ServerUtils';

async function main() {
  const { server } = await getServerConnection();
  try {
    let session: Session | null = null;
    while (!session) {
      session = await CliAuth.veryInsecureCreateSession(server, 'test', 'john-smith');
    }
    const context = server.createSessionContext(session);
    await CliMain.mainMenu(context);
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
