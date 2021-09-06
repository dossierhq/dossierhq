import { CoreTestUtils, ErrorType } from '@jonasb/datadata-core';
import type { AuthContext, Server2 } from '@jonasb/datadata-server';
import { Auth } from '@jonasb/datadata-server';
import { validate as validateUuid } from 'uuid';
import type { TestFunctionInitializer, TestSuite } from '..';
import { assertSame, assertTruthy } from '../Asserts';
import { buildSuite } from '../Builder';

const { expectErrorResult, expectOkResult } = CoreTestUtils;

export function createAuthTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<{ authContext: AuthContext; server: Server2 }, TCleanup>
): TestSuite {
  return buildSuite(
    initializer,
    createPrincipal_create_new_identifier,
    createPrincipal_error_create_duplicate_fails,
    createPrincipal_error_create_missing_provider,
    createPrincipal_error_create_missing_identifier,
    createSession_create_new_identifier,
    createSession_create_existing_identifier,
    createSession_error_missing_provider,
    createSession_error_create_missing_identifier
  );
}

function randomIdentifier() {
  return Math.random().toString();
}

async function createPrincipal_create_new_identifier({
  authContext,
}: {
  authContext: AuthContext;
}) {
  const result = await Auth.createPrincipal(authContext, 'test', randomIdentifier());
  if (expectOkResult(result)) {
    assertTruthy(validateUuid(result.value));
  }
}

async function createPrincipal_error_create_duplicate_fails({
  authContext,
}: {
  authContext: AuthContext;
}) {
  const identifier = randomIdentifier();
  const firstResult = await Auth.createPrincipal(authContext, 'test', identifier);
  expectOkResult(firstResult);

  const secondResult = await Auth.createPrincipal(authContext, 'test', identifier);
  expectErrorResult(secondResult, ErrorType.Conflict, 'Principal already exist');
}

async function createPrincipal_error_create_missing_provider({
  authContext,
}: {
  authContext: AuthContext;
}) {
  const identifier = randomIdentifier();
  const result = await Auth.createPrincipal(authContext, '', identifier);
  expectErrorResult(result, ErrorType.BadRequest, 'Missing provider');
}

async function createPrincipal_error_create_missing_identifier({
  authContext,
}: {
  authContext: AuthContext;
}) {
  const result = await Auth.createPrincipal(authContext, 'test', '');
  expectErrorResult(result, ErrorType.BadRequest, 'Missing identifier');
}

async function createSession_create_new_identifier({ server }: { server: Server2 }) {
  const result = await server.createSession('test', randomIdentifier());
  if (expectOkResult(result)) {
    const { principalEffect } = result.value;
    assertSame(principalEffect, 'created');
  }
}

async function createSession_create_existing_identifier({ server }: { server: Server2 }) {
  const identifier = randomIdentifier();

  const firstResult = await server.createSession('test', identifier);
  if (expectOkResult(firstResult)) {
    const { principalEffect } = firstResult.value;
    assertSame(principalEffect, 'created');
  }

  const secondResult = await server.createSession('test', identifier);
  if (expectOkResult(secondResult)) {
    const { principalEffect } = secondResult.value;
    assertSame(principalEffect, 'none');
  }
}

async function createSession_error_missing_provider({ server }: { server: Server2 }) {
  const result = await server.createSession('', randomIdentifier());
  expectErrorResult(result, ErrorType.BadRequest, 'Missing provider');
}

async function createSession_error_create_missing_identifier({ server }: { server: Server2 }) {
  const result = await server.createSession('test', '');
  expectErrorResult(result, ErrorType.BadRequest, 'Missing identifier');
}
