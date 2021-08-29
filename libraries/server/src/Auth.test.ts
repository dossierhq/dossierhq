import { CoreTestUtils, ErrorType } from '@jonasb/datadata-core';
import { validate as validateUuid } from 'uuid';
import type { AuthContext, Server } from '.';
import { Auth } from '.';
import { createPostgresTestServer } from './test/AdditionalTestUtils';

const { expectErrorResult, expectOkResult } = CoreTestUtils;

let server: Server;
let context: AuthContext;

beforeAll(async () => {
  server = await createPostgresTestServer();
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
      expect(validateUuid(result.value)).toBeTruthy();
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
      expect(validateUuid(session.value.subjectId)).toBeTruthy();
      expect(typeof session.value.subjectInternalId).toBe('number');
    }
  });

  test('createPrincipalIfMissing creates principal', async () => {
    const identifier = randomIdentifier();

    const result = await Auth.createSessionForPrincipal(context, 'test', identifier);
    expectErrorResult(result, ErrorType.NotFound, 'Principal doesn’t exist');

    const session = await Auth.createSessionForPrincipal(context, 'test', identifier, {
      createPrincipalIfMissing: true,
    });
    if (expectOkResult(session)) {
      expect(validateUuid(session.value.subjectId)).toBeTruthy();
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
