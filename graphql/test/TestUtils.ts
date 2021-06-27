import type {
  AdminClient,
  ErrorType,
  PublishedClient,
  Result,
  Schema,
  SchemaSpecification,
} from '@datadata/core';
import { CoreTestUtils } from '@datadata/core';
import {
  createServerAdminClient,
  createServerPublishedClient,
  ServerTestUtils,
} from '@datadata/server';

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
  const server = await createTestServer();
  const context = await ensureSessionContext(server, 'test', 'identifier');
  const subjectId = context.session.subjectId;
  const adminClient = createServerAdminClient({ resolveContext: () => Promise.resolve(context) });
  const publishedClient = createServerPublishedClient({
    resolveContext: () => Promise.resolve(context),
  });

  await updateSchema(context, schemaSpecification);

  return {
    schema: server.getSchema(),
    adminClient,
    publishedClient,
    subjectId,
    tearDown: () => server.shutdown(),
  };
}
