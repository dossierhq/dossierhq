import { createBetterSqlite3Adapter } from '@dossierhq/better-sqlite3';
import {
  assertOkResult,
  NoOpLogger,
  Schema,
  type DossierClient,
  type ErrorType,
  type PromiseResult,
  type PublishedDossierClient,
  type SchemaSpecificationUpdate,
} from '@dossierhq/core';
import {
  createServer,
  SubjectAuthorizationAdapter,
  type AuthorizationAdapter,
} from '@dossierhq/server';
import Database from 'better-sqlite3';

export interface TestServerWithSession {
  schema: Schema;
  client: DossierClient;
  clientOther: DossierClient;
  publishedClient: PublishedDossierClient;
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
  const clientOther = server.createDossierClient(() => sessionOtherResult);
  const publishedClient = server.createPublishedDossierClient(context);

  const schemaResult = await client.updateSchemaSpecification(schemaSpecification);
  assertOkResult(schemaResult);

  return {
    schema: new Schema(schemaResult.value.schemaSpecification),
    client,
    clientOther,
    publishedClient,
    subjectId,
    tearDown: () => server.shutdown(),
  };
}

function createTestAuthorizationAdapter(): AuthorizationAdapter {
  return SubjectAuthorizationAdapter;
}

export function createUuid(): string {
  return crypto.randomUUID();
}
