import { createConsoleLogger, ok } from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/server';
import {
  BackgroundEntityValidatorPlugin,
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

  const backgroundEntityValidator = new BackgroundEntityValidatorPlugin(server, logger);
  server.addPlugin(backgroundEntityValidator);
  backgroundEntityValidator.start();

  return ok({ server });
}
