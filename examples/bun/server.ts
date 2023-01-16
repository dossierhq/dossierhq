#!/usr/bin/env -S bun
import { createConsoleLogger, FieldType } from '@dossierhq/core';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@jonasb/datadata-server';
import { createAdapter } from './ServerUtils.js';

const logger = createConsoleLogger(console);

const serverResult = await createServer({
  databaseAdapter: (await createAdapter({ logger }, 'databases/server.sqlite')).valueOrThrow(),
  logger,
  authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
});
if (serverResult.isError()) throw serverResult.toError();

const server = serverResult.value;
try {
  const sessionResult = await server.createSession({
    provider: 'sys',
    identifier: 'test',
    defaultAuthKeys: ['none', 'subject'],
  });
  if (sessionResult.isError()) throw sessionResult.toError();
  const adminClient = server.createAdminClient(sessionResult.value.context);

  (
    await adminClient.updateSchemaSpecification({
      entityTypes: [
        {
          name: 'TitleOnly',
          fields: [{ name: 'title', type: FieldType.String }],
        },
      ],
    })
  ).throwIfError();

  const createResult = await adminClient.createEntity(
    {
      info: { type: 'TitleOnly', name: 'Deno test', authKey: 'none' },
      fields: { title: 'Deno test' },
    },
    { publish: true }
  );
  if (createResult.isError()) {
    logger.error('Failed creating entity: %O', createResult);
  } else {
    logger.info('Created entity: %O', createResult.value);
  }
} finally {
  await server.shutdown();
}
