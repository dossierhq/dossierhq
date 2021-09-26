import type {
  AdminClient,
  ErrorType,
  PromiseResult,
  PublishedClient,
  Result,
  SchemaSpecification,
} from '@jonasb/datadata-core';
import { assertIsDefined, CoreTestUtils, Schema } from '@jonasb/datadata-core';
import { createPostgresAdapter } from '@jonasb/datadata-database-adapter-postgres-pg';
import { createServer } from '@jonasb/datadata-server';
import { v4 as uuidv4 } from 'uuid';

const { expectOkResult } = CoreTestUtils;

export interface TestServerWithSession {
  schema: Schema;
  adminClient: AdminClient;
  publishedClient: PublishedClient;
  subjectId: string;
  tearDown: () => PromiseResult<void, ErrorType.Generic>;
}

export function expectResultValue<TOk, TError extends ErrorType>(
  result: Result<TOk, TError>,
  expectedValue: TOk
): void {
  if (expectOkResult(result)) {
    expect(result.value).toEqual<TOk>(expectedValue);
  }
}

export async function setUpServerWithSession(
  schemaSpecification: Partial<SchemaSpecification>
): Promise<TestServerWithSession> {
  return await setUpRealServerWithSession(schemaSpecification);
}

async function setUpRealServerWithSession(schemaSpecification: Partial<SchemaSpecification>) {
  const url = process.env.DATABASE_URL;
  assertIsDefined(url);
  const serverResult = await createServer({
    databaseAdapter: createPostgresAdapter(url),
  });
  if (serverResult.isError()) throw serverResult.toError();
  const server = serverResult.value;
  const sessionResult = await server.createSession('test', 'identifier');
  if (sessionResult.isError()) throw serverResult.toError();
  const { context } = sessionResult.value;
  const subjectId = context.session.subjectId;
  const adminClient = server.createAdminClient(context);
  const publishedClient = server.createPublishedClient(context);

  await adminClient.updateSchemaSpecification(schemaSpecification);

  const schemaResult = await adminClient.getSchemaSpecification();
  if (schemaResult.isError()) throw schemaResult.toError();

  return {
    schema: new Schema(schemaResult.value),
    adminClient,
    publishedClient,
    subjectId,
    tearDown: () => server.shutdown(),
  };
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
