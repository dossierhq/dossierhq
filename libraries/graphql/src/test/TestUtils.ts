import type {
  AdminClient,
  AdminSchemaSpecificationUpdate,
  ErrorType,
  PromiseResult,
  PublishedClient,
  Result,
} from '@jonasb/datadata-core';
import { AdminSchema, assertIsDefined, CoreTestUtils, ok } from '@jonasb/datadata-core';
import { createPostgresAdapter } from '@jonasb/datadata-database-adapter-postgres-pg';
import type { AuthorizationAdapter } from '@jonasb/datadata-server';
import { createServer } from '@jonasb/datadata-server';
import { v4 as uuidv4 } from 'uuid';

const { expectOkResult } = CoreTestUtils;

export interface TestServerWithSession {
  schema: AdminSchema;
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
  schemaSpecification: AdminSchemaSpecificationUpdate
): Promise<TestServerWithSession> {
  return await setUpRealServerWithSession(schemaSpecification);
}

async function setUpRealServerWithSession(schemaSpecification: AdminSchemaSpecificationUpdate) {
  const url = process.env.DATABASE_URL;
  assertIsDefined(url);
  const serverResult = await createServer({
    databaseAdapter: createPostgresAdapter({ connectionString: url }),
    authorizationAdapter: createTestAuthorizationAdapter(),
  });
  if (serverResult.isError()) throw serverResult.toError();
  const server = serverResult.value;
  const sessionResult = await server.createSession({ provider: 'test', identifier: 'identifier' });
  if (sessionResult.isError()) throw serverResult.toError();
  const { context } = sessionResult.value;
  const subjectId = context.session.subjectId;
  const adminClient = server.createAdminClient(context);
  const publishedClient = server.createPublishedClient(context);

  await adminClient.updateSchemaSpecification(schemaSpecification);

  const schemaResult = await adminClient.getSchemaSpecification();
  if (schemaResult.isError()) throw schemaResult.toError();

  return {
    schema: new AdminSchema(schemaResult.value),
    adminClient,
    publishedClient,
    subjectId,
    tearDown: () => server.shutdown(),
  };
}

function createTestAuthorizationAdapter(): AuthorizationAdapter {
  return {
    async resolveAuthorizationKeys<T extends string>(authKeys: T[]) {
      const result = {} as Record<T, string>;
      for (const key of authKeys) {
        result[key] = key;
      }
      return ok(result);
    },
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
