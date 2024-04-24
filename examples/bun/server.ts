#!/usr/bin/env -S bun
import { createConsoleLogger, FieldType } from '@dossierhq/core';
import { BackgroundEntityProcessorPlugin, createServer } from '@dossierhq/server';
import { createAdapter } from './ServerUtils.js';

const logger = createConsoleLogger(console);

const serverResult = await createServer({
  databaseAdapter: (await createAdapter({ logger }, 'databases/server.sqlite')).valueOrThrow(),
  logger,
});
if (serverResult.isError()) throw serverResult.toError();
const server = serverResult.value;

const processorPlugin = new BackgroundEntityProcessorPlugin(server, logger);
server.addPlugin(processorPlugin);
processorPlugin.start();

try {
  const sessionResult = await server.createSession({
    provider: 'sys',
    identifier: 'test',
    logger,
  });
  if (sessionResult.isError()) throw sessionResult.toError();
  const client = server.createDossierClient(sessionResult.value.context);

  (
    await client.updateSchemaSpecification({
      entityTypes: [
        {
          name: 'TitleOnly',
          fields: [{ name: 'title', type: FieldType.String }],
        },
      ],
    })
  ).throwIfError();

  const createResult = await client.createEntity(
    {
      info: { type: 'TitleOnly', name: 'Bun test' },
      fields: { title: 'Bun test' },
    },
    { publish: true },
  );
  if (createResult.isError()) {
    logger.error('Failed creating entity: %O', createResult);
  } else {
    logger.info('Created entity: %O', createResult.value);
  }
} finally {
  await server.shutdown();
}
