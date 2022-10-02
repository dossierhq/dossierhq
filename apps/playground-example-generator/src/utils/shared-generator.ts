import type {
  AdminClientMiddleware,
  AdminSchemaSpecificationUpdate,
  ClientContext,
} from '@jonasb/datadata-core';
import { createConsoleLogger, LoggingClientMiddleware, NoOpLogger } from '@jonasb/datadata-core';
import { createSqlJsAdapter } from '@jonasb/datadata-database-adapter-sqlite-sql.js';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@jonasb/datadata-server';
import { writeFile } from 'fs/promises';
import { randomUUID } from 'node:crypto';
import type { Database } from 'sql.js';
import initSqlJs from 'sql.js';

export async function createDatabase() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  return db;
}

export async function createAdapterAndServer(
  database: Database,
  schema: AdminSchemaSpecificationUpdate
) {
  const databaseAdapter = (
    await createSqlJsAdapter({ logger: NoOpLogger }, database, { randomUUID })
  ).valueOrThrow();
  const server = (
    await createServer({
      databaseAdapter,
      authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
    })
  ).valueOrThrow();

  const session = (
    await server.createSession({
      provider: 'sys',
      identifier: 'alice',
      defaultAuthKeys: ['none', 'subject'],
      logger: createConsoleLogger(console),
    })
  ).valueOrThrow();

  const adminClient = server.createAdminClient(session.context, [
    LoggingClientMiddleware as AdminClientMiddleware<ClientContext>,
  ]);
  (await adminClient.updateSchemaSpecification(schema)).valueOrThrow();

  return { adminClient };
}

export async function exportDatabase(database: Database, file: string) {
  const data = database.export();
  const buffer = Buffer.from(data);
  await writeFile(file, buffer);
  console.log(`Wrote to ${file}`);
}
