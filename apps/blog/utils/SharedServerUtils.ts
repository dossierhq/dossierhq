import { createConsoleLogger, ok } from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/server';
import {
  BackgroundEntityProcessorPlugin,
  NoneAndSubjectAuthorizationAdapter,
  createServer,
} from '@dossierhq/server';

const logger = createConsoleLogger(console);

export async function createBlogServer(databaseAdapter: DatabaseAdapter) {
  const serverResult = await createServer({
    databaseAdapter,
    authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
    logger,
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const plugin = new BackgroundEntityProcessorPlugin(server, logger);
  server.addPlugin(plugin);
  plugin.start();

  return ok({ server });
}
