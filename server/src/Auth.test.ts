import { CoreTestUtils, ErrorType } from '@datadata/core';
import type { AuthContext, Server } from '.';
import { Auth } from '.';
import { createTestServer } from './ServerTestUtils';
import { uuidMatcher } from '../test/AdditionalTestUtils';

const { expectErrorResult, expectOkResult } = CoreTestUtils;

let server: Server;
let context: AuthContext;

beforeAll(async () => {
  server = await createTestServer();
  context = server.createAuthContext();
});
afterAll(async () => {
  await server.shutdown();
});

function randomIdentifier() {
  return Math.random().toString();
}

describe('createPrincipal', () => {
  test('Create test/new-identifier', async () => {
    const result = await Auth.createPrincipal(context, 'test', randomIdentifier());
    if (expectOkResult(result)) {
      expect(result.value).toMatch(uuidMatcher);
    }
  });

  test('Error: Create duplicate fails', async () => {
    const identifier = randomIdentifier();
    const firstResult = await Auth.createPrincipal(context, 'test', identifier);
    expectOkResult(firstResult);

    const secondResult = await Auth.createPrincipal(context, 'test', identifier);
    expectErrorResult(secondResult, ErrorType.Conflict, 'Principal already exist');
  });

  test('Error: create missing provider', async () => {
    const identifier = randomIdentifier();
    const result = await Auth.createPrincipal(context, '', identifier);
    expectErrorResult(result, ErrorType.BadRequest, 'Missing provider');
  });

  test('Error: create missing identifier', async () => {
    const result = await Auth.createPrincipal(context, 'test', '');
    expectErrorResult(result, ErrorType.BadRequest, 'Missing identifier');
  });
});

describe('createSessionForPrincipal', () => {
  test('Use existing principal', async () => {
    const identifier = randomIdentifier();
    const result = await Auth.createPrincipal(context, 'test', identifier);
    expectOkResult(result);

    const session = await Auth.createSessionForPrincipal(context, 'test', identifier);
    if (expectOkResult(session)) {
      expect(session.value.subjectId).toMatch(uuidMatcher);
      expect(typeof session.value.subjectInternalId).toBe('number');
    }
  });

  test('Error: missing provider', async () => {
    const identifier = randomIdentifier();
    const session = await Auth.createSessionForPrincipal(context, '', identifier);
    expectErrorResult(session, ErrorType.BadRequest, 'Missing provider');
  });

  test('Error: missing identifier', async () => {
    const session = await Auth.createSessionForPrincipal(context, 'test', '');
    expectErrorResult(session, ErrorType.BadRequest, 'Missing identifier');
  });

  test('Error: non-existent principal', async () => {
    const result = await Auth.createSessionForPrincipal(context, 'test', randomIdentifier());
    expectErrorResult(result, ErrorType.NotFound, 'Principal doesn’t exist');
  });
});
