import { createBetterSqlite3Adapter } from '@dossierhq/better-sqlite3';
import { FieldType, createConsoleLogger } from '@dossierhq/core';
import { createServer } from '@dossierhq/server';
import Database from 'better-sqlite3';

async function main() {
  const logger = createConsoleLogger(console);
  const database = new Database('databases/test.sqlite');
  const databaseAdapterResult = await createBetterSqlite3Adapter({ logger }, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
  const databaseAdapter = databaseAdapterResult.valueOrThrow();
  const serverResult = await createServer({
    databaseAdapter,
    logger,
  });
  const server = serverResult.valueOrThrow();

  try {
    const sessionResult = await server.createSession({
      provider: 'sys',
      identifier: 'anonymous',
    });
    const session = sessionResult.valueOrThrow();

    const adminClient = server.createDossierClient(session.context).toExceptionClient();

    await adminClient.updateSchemaSpecification({
      entityTypes: [
        {
          name: 'TitleOnly',
          nameField: 'title',
          fields: [{ name: 'title', type: FieldType.String }],
        },
      ],
    });

    await adminClient.createEntity({
      info: { type: 'TitleOnly', name: 'Hello' },
      fields: { title: 'Hello, World!' },
    });
  } finally {
    server.shutdown();
  }
}

await main();
