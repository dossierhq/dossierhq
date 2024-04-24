import { createBetterSqlite3Adapter } from '@dossierhq/better-sqlite3';
import type {
  DossierClient,
  SchemaSpecificationUpdate,
  ErrorType,
  PromiseResult,
  PublishedClient,
} from '@dossierhq/core';
import { Schema, NoOpLogger, assertOkResult } from '@dossierhq/core';
import type { AuthorizationAdapter } from '@dossierhq/server';
import { SubjectAuthorizationAdapter, createServer } from '@dossierhq/server';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface TestServerWithSession {
  schema: Schema;
  client: DossierClient;
  adminClientOther: DossierClient;
  publishedClient: PublishedClient;
  subjectId: string;
  tearDown: () => PromiseResult<void, typeof ErrorType.Generic>;
}

export async function setUpServerWithSession(
  schemaSpecification: SchemaSpecificationUpdate,
  databasePath: string,
): Promise<TestServerWithSession> {
  return await setUpRealServerWithSession(schemaSpecification, databasePath);
}

async function setUpRealServerWithSession(
  schemaSpecification: SchemaSpecificationUpdate,
  databasePath: string,
): Promise<TestServerWithSession> {
  const serverContext = { logger: NoOpLogger };
  const database = new Database(databasePath);
  const adapterResult = await createBetterSqlite3Adapter(serverContext, database, {
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
  });
  assertOkResult(sessionResult);
  const { context } = sessionResult.value;
  const subjectId = context.session.subjectId;

  const client = server.createDossierClient(context);

  const sessionOtherResult = server.createSession({
    provider: 'test',
    identifier: 'other',
  });
  const adminClientOther = server.createDossierClient(() => sessionOtherResult);
  const publishedClient = server.createPublishedClient(context);

  const schemaResult = await client.updateSchemaSpecification(schemaSpecification);
  assertOkResult(schemaResult);

  return {
    schema: new Schema(schemaResult.value.schemaSpecification),
    client,
    adminClientOther,
    publishedClient,
    subjectId,
    tearDown: () => server.shutdown(),
  };
}

function createTestAuthorizationAdapter(): AuthorizationAdapter {
  return SubjectAuthorizationAdapter;
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
