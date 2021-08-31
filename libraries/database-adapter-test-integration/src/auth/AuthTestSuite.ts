import { CoreTestUtils, ErrorType } from '@jonasb/datadata-core';
import type { AuthContext } from '@jonasb/datadata-server';
import { Auth } from '@jonasb/datadata-server';
import { validate as validateUuid } from 'uuid';
import type { TestFunctionInitializer, TestSuite } from '..';
import { assertTruthy } from '../Asserts';
import { buildSuite } from '../Builder';

const { expectErrorResult, expectOkResult } = CoreTestUtils;

export function createAuthTestSuite<TCleanup>(
  authContext: TestFunctionInitializer<AuthContext, TCleanup>
): TestSuite {
  return buildSuite(
    authContext,
    createPrincipal_create_new_identifier,
    createPrincipal_error_create_duplicate_fails,
    createPrincipal_error_create_missing_provider,
    createPrincipal_error_create_missing_identifier
  );
}

function randomIdentifier() {
  return Math.random().toString();
}

async function createPrincipal_create_new_identifier(authContext: AuthContext) {
  const result = await Auth.createPrincipal(authContext, 'test', randomIdentifier());
  if (expectOkResult(result)) {
    assertTruthy(validateUuid(result.value));
  }
}

async function createPrincipal_error_create_duplicate_fails(authContext: AuthContext) {
  const identifier = randomIdentifier();
  const firstResult = await Auth.createPrincipal(authContext, 'test', identifier);
  expectOkResult(firstResult);

  const secondResult = await Auth.createPrincipal(authContext, 'test', identifier);
  expectErrorResult(secondResult, ErrorType.Conflict, 'Principal already exist');
}

async function createPrincipal_error_create_missing_provider(authContext: AuthContext) {
  const identifier = randomIdentifier();
  const result = await Auth.createPrincipal(authContext, '', identifier);
  expectErrorResult(result, ErrorType.BadRequest, 'Missing provider');
}

async function createPrincipal_error_create_missing_identifier(authContext: AuthContext) {
  const result = await Auth.createPrincipal(authContext, 'test', '');
  expectErrorResult(result, ErrorType.BadRequest, 'Missing identifier');
}
