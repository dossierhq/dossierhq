import { CoreTestUtils } from '@jonasb/datadata-core';
import type { AuthContext } from '@jonasb/datadata-server';
import { Auth } from '@jonasb/datadata-server';
import { validate as validateUuid } from 'uuid';
import type { TestFunctionInitializer, TestSuite } from '..';
import { assertTruthy } from '../Asserts';
import { buildSuite } from '../Builder';

const { expectOkResult } = CoreTestUtils;

export function createAuthTestSuite<TCleanup>(
  authContext: TestFunctionInitializer<AuthContext, TCleanup>
): TestSuite {
  return buildSuite(authContext, createPrincipal_create_new_identifier);
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
