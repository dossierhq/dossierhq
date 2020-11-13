import type { EntityHistory, Instance, OkResult, Result, SessionContext } from '../src';
import { Auth, ErrorType } from '../src';

export const uuidMatcher = /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/;

export function expectOkResult<TOk, TError extends ErrorType>(
  actual: Result<unknown, ErrorType>
): actual is OkResult<TOk, TError> {
  if (actual.isError()) {
    throw new Error(`Expected ok, got error ${actual.error}: ${actual.message}`);
  }
  return true;
}

export function expectErrorResult(
  actual: Result<unknown, ErrorType>,
  expectedErrorType: ErrorType,
  expectedMessage: string
): void {
  expect(actual.isError()).toBeTruthy();
  if (actual.isError()) {
    expect(actual.error).toEqual(expectedErrorType);
    expect(actual.message).toEqual(expectedMessage);
  }
}

export async function ensureSessionContext(
  instance: Instance,
  provider: string,
  identifier: string
): Promise<SessionContext> {
  const authContext = instance.createAuthContext();
  const sessionResult = await Auth.createSessionForPrincipal(authContext, provider, identifier);
  if (sessionResult.isOk()) {
    return instance.createSessionContext(sessionResult.value);
  }

  if (sessionResult.error !== ErrorType.NotFound) {
    throw new Error(
      `Unexpected error creating session ${sessionResult.error}: ${sessionResult.message}`
    );
  }

  const createResult = await Auth.createPrincipal(authContext, provider, identifier);
  if (createResult.isError()) {
    throw new Error(
      `Unexpected error creating principal ${createResult.error}: ${createResult.message}`
    );
  }

  const sessionResult2 = await Auth.createSessionForPrincipal(authContext, provider, identifier);
  if (sessionResult2.isError()) {
    throw new Error(
      `Unexpected error creating session ${sessionResult2.error}: ${sessionResult2.message}`
    );
  }
  return instance.createSessionContext(sessionResult2.value);
}

export function expectEntityHistoryVersions(
  actual: EntityHistory,
  expectedVersions: Omit<EntityHistory['versions'][0], 'createdAt'>[]
): void {
  // Skip createdAt since dates are unpredictable
  const actualVersions = actual.versions.map((x) => {
    const { createdAt: unusedCreatedAt, ...version } = x;
    return version;
  });
  expect(actualVersions).toEqual(expectedVersions);
}
