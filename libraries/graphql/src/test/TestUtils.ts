import type {
  AdminClient,
  AdminSchemaSpecificationUpdate,
  ErrorType,
  PromiseResult,
  PublishedClient,
} from '@dossierhq/core';
import { AdminSchema, assertOkResult, NoOpLogger } from '@dossierhq/core';
import { createDatabase, createSqlite3Adapter } from '@dossierhq/database-adapter-sqlite-sqlite3';
import type { AuthorizationAdapter } from '@dossierhq/server';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@dossierhq/server';
import * as Sqlite from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

// TODO @types/sqlite is slightly wrong in terms of CommonJS/ESM export
const { Database } = (Sqlite as unknown as { default: typeof Sqlite }).default;

export interface TestServerWithSession {
  schema: AdminSchema;
  adminClient: AdminClient;
  adminClientOther: AdminClient;
  publishedClient: PublishedClient;
  subjectId: string;
  tearDown: () => PromiseResult<void, typeof ErrorType.Generic>;
}

export async function setUpServerWithSession(
  schemaSpecification: AdminSchemaSpecificationUpdate,
  databasePath: string
): Promise<TestServerWithSession> {
  return await setUpRealServerWithSession(schemaSpecification, databasePath);
}

async function setUpRealServerWithSession(
  schemaSpecification: AdminSchemaSpecificationUpdate,
  databasePath: string
): Promise<TestServerWithSession> {
  const serverContext = { logger: NoOpLogger };
  const databaseResult = await createDatabase(serverContext, Database, { filename: databasePath });
  assertOkResult(databaseResult);
  const adapterResult = await createSqlite3Adapter(serverContext, databaseResult.value, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });

  const serverResult = await createServer({
    databaseAdapter: adapterResult.valueOrThrow(),
    authorizationAdapter: createTestAuthorizationAdapter(),
  });
  assertOkResult(serverResult);
  const server = serverResult.value;

  const sessionResult = await server.createSession({
    provider: 'test',
    identifier: 'identifier',
    defaultAuthKeys: ['none'],
  });
  assertOkResult(sessionResult);
  const { context } = sessionResult.value;
  const subjectId = context.session.subjectId;

  const adminClient = server.createAdminClient(context);

  const sessionOtherResult = server.createSession({
    provider: 'test',
    identifier: 'other',
    defaultAuthKeys: ['none'],
  });
  const adminClientOther = server.createAdminClient(() => sessionOtherResult);
  const publishedClient = server.createPublishedClient(context);

  const schemaResult = await adminClient.updateSchemaSpecification(schemaSpecification);
  assertOkResult(schemaResult);

  return {
    schema: new AdminSchema(schemaResult.value.schemaSpecification),
    adminClient,
    adminClientOther,
    publishedClient,
    subjectId,
    tearDown: () => server.shutdown(),
  };
}

function createTestAuthorizationAdapter(): AuthorizationAdapter {
  return NoneAndSubjectAuthorizationAdapter;
}

/** N.B. This is insecure but needed since the default uuidv4() results in open handle for tests */
export function insecureTestUuidv4(): string {
  const random = new Uint8Array(16);

  for (let i = 0; i < random.length; i++) {
    random[i] = Math.floor(Math.random() * 255);
  }
  return uuidv4({
    random,
  });
}
