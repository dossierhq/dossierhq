import { CoreTestUtils, ErrorType } from '@jonasb/datadata-core';
import type { AuthContext } from '@jonasb/datadata-server';
import { Auth, Server } from '@jonasb/datadata-server';
import { validate as validateUuid } from 'uuid';
import { createPostgresTestAdapter } from '../TestUtils';

const { expectErrorResult, expectOkResult } = CoreTestUtils;

let server: Server;
let context: AuthContext;

beforeAll(async () => {
  server = new Server({ databaseAdapter: createPostgresTestAdapter() });
  context = server.createAuthContext();
});
afterAll(async () => {
  await server.shutdown();
});

function randomIdentifier() {
  return Math.random().toString();
}

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
