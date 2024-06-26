import { ErrorType } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { assertErrorResult, assertOkResult, assertSame } from '../Asserts.js';
import { buildSuite } from '../Builder.js';
import type { TestFunctionInitializer, TestSuite } from '../index.js';

interface AuthTestContext {
  server: Server;
}

export function createAuthTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<AuthTestContext, TCleanup>,
): TestSuite {
  return buildSuite(
    initializer,
    createSession_create_new_identifier,
    createSession_create_existing_identifier,
    createSession_error_missing_provider,
    createSession_error_create_missing_identifier,
    createSession_error_invalid_default_auth_key,
  );
}

function randomIdentifier() {
  return Math.random().toString();
}

async function createSession(
  server: Server,
  options?: { provider?: string; identifier?: string; defaultAuthKeys?: string[] },
) {
  return await server.createSession({
    provider: options?.provider ?? 'test',
    identifier: options?.identifier ?? randomIdentifier(),
    defaultAuthKeys: options?.defaultAuthKeys ?? [''],
  });
}

async function createSession_create_new_identifier({ server }: AuthTestContext) {
  const result = await createSession(server);
  assertOkResult(result);
  const { principalEffect } = result.value;
  assertSame(principalEffect, 'created');
}

async function createSession_create_existing_identifier({ server }: AuthTestContext) {
  const identifier = randomIdentifier();

  const firstResult = await createSession(server, { identifier });
  assertOkResult(firstResult);
  const { principalEffect: principalEffect1 } = firstResult.value;
  assertSame(principalEffect1, 'created');

  const secondResult = await createSession(server, { identifier });
  assertOkResult(secondResult);
  const { principalEffect: principalEffect2 } = secondResult.value;
  assertSame(principalEffect2, 'none');
}

async function createSession_error_missing_provider({ server }: AuthTestContext) {
  const result = await createSession(server, { provider: '' });
  assertErrorResult(result, ErrorType.BadRequest, 'Missing provider');
}

async function createSession_error_create_missing_identifier({ server }: AuthTestContext) {
  const result = await createSession(server, { identifier: '' });
  assertErrorResult(result, ErrorType.BadRequest, 'Missing identifier');
}

async function createSession_error_invalid_default_auth_key({ server }: AuthTestContext) {
  const result = await createSession(server, { defaultAuthKeys: ['', ' starting whitespace'] });
  assertErrorResult(
    result,
    ErrorType.BadRequest,
    'Invalid authKey ( starting whitespace), can’t start with whitespace',
  );
}
