import type {
  AdminClient,
  ErrorType,
  PublishedClient,
  Result,
  SchemaSpecification,
} from '@jonasb/datadata-core';
import { CoreTestUtils, Schema } from '@jonasb/datadata-core';
import {
  createServerAdminClient,
  createServerPublishedClient,
  ServerTestUtils,
} from '@jonasb/datadata-server';
import {
  createInMemoryAdminClient,
  createInMemoryPublishedClient,
  InMemoryServer,
} from '@jonasb/datadata-testing-utils';
import { v4 as uuidv4 } from 'uuid';

const { expectOkResult } = CoreTestUtils;
const { createTestServer, ensureSessionContext, updateSchema } = ServerTestUtils;

export interface TestServerWithSession {
  schema: Schema;
  adminClient: AdminClient;
  publishedClient: PublishedClient;
  subjectId: string;
  tearDown: () => Promise<void>;
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
  if (process.env.TEST_SERVER === 'in-memory') {
    return await setUpInMemoryServerWithSession(schemaSpecification);
  }
  return await setUpRealServerWithSession(schemaSpecification);
}

async function setUpRealServerWithSession(schemaSpecification: Partial<SchemaSpecification>) {
  const server = await createTestServer();
  const context = await ensureSessionContext(server, 'test', 'identifier');
  const subjectId = context.session.subjectId;
  const adminClient = createServerAdminClient({ context });
  const publishedClient = createServerPublishedClient({ context });

  await updateSchema(context, schemaSpecification);

  return {
    schema: server.getSchema(),
    adminClient,
    publishedClient,
    subjectId,
    tearDown: () => server.shutdown(),
  };
}

async function setUpInMemoryServerWithSession(schemaSpecification: Partial<SchemaSpecification>) {
  const schema = new Schema({
    entityTypes: schemaSpecification.entityTypes ?? [],
    valueTypes: schemaSpecification.valueTypes ?? [],
  });
  const server = new InMemoryServer(schema);

  const context = server.createContext(uuidv4());
  const subjectId = context.subjectId;
  const adminClient = createInMemoryAdminClient({ context });
  const publishedClient = createInMemoryPublishedClient({ context });

  return {
    schema,
    adminClient,
    publishedClient,
    subjectId,
    tearDown: () => Promise.resolve(undefined),
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
