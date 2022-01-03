import { ErrorType } from '@jonasb/datadata-core';
import type { Server } from '@jonasb/datadata-server';
import type { TestFunctionInitializer, TestSuite } from '..';
import { assertErrorResult, assertOkResult, assertSame } from '../Asserts';
import { buildSuite } from '../Builder';

export function createAuthTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<{ server: Server }, TCleanup>
): TestSuite {
  return buildSuite(
    initializer,
    createSession_create_new_identifier,
    createSession_create_existing_identifier,
    createSession_error_missing_provider,
    createSession_error_create_missing_identifier
  );
}

function randomIdentifier() {
  return Math.random().toString();
}

async function createSession(server: Server, options?: { provider?: string; identifier?: string }) {
  return await server.createSession({
    provider: options?.provider ?? 'test',
    identifier: options?.identifier ?? randomIdentifier(),
    defaultAuthKeys: ['none'],
  });
}

async function createSession_create_new_identifier({ server }: { server: Server }) {
  const result = await createSession(server);
  if (assertOkResult(result)) {
    const { principalEffect } = result.value;
    assertSame(principalEffect, 'created');
  }
}

async function createSession_create_existing_identifier({ server }: { server: Server }) {
  const identifier = randomIdentifier();

  const firstResult = await createSession(server, { identifier });
  if (assertOkResult(firstResult)) {
    const { principalEffect } = firstResult.value;
    assertSame(principalEffect, 'created');
  }

  const secondResult = await createSession(server, { identifier });
  if (assertOkResult(secondResult)) {
    const { principalEffect } = secondResult.value;
    assertSame(principalEffect, 'none');
  }
}

async function createSession_error_missing_provider({ server }: { server: Server }) {
  const result = await createSession(server, { provider: '' });
  assertErrorResult(result, ErrorType.BadRequest, 'Missing provider');
}

async function createSession_error_create_missing_identifier({ server }: { server: Server }) {
  const result = await createSession(server, { identifier: '' });
  assertErrorResult(result, ErrorType.BadRequest, 'Missing identifier');
}
