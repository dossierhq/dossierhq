import { Auth, AuthContext, Instance } from '.';
import { ErrorType } from '.';
import TestInstance from '../test/TestInstance';

let instance: Instance;
let context: AuthContext;

beforeAll(() => {
  instance = TestInstance.createInstance();
  context = instance.createAuthContext();
});
afterAll(async () => {
  await instance.shutdown();
});

function randomIdentifier() {
  return Math.random().toString();
}

describe('createPrincipal', () => {
  test('Create test/new-identifier', async () => {
    const result = await Auth.createPrincipal(context, 'test', randomIdentifier());
    expect(result.isOk()).toBeTruthy();
    if (result.isOk()) {
      expect(result.value).toMatch(
        /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/
      );
    }
  });

  test('Error: Create duplicate fails', async () => {
    const identifier = randomIdentifier();
    const firstResult = await Auth.createPrincipal(context, 'test', identifier);
    expect(firstResult.isOk());

    const secondResult = await Auth.createPrincipal(context, 'test', identifier);
    expect(secondResult.isError() && secondResult.error).toEqual(ErrorType.Conflict);
  });

  test('Error: create missing provider', async () => {
    const identifier = randomIdentifier();
    const result = await Auth.createPrincipal(context, '', identifier);
    expect(result.isError() && result.error).toEqual(ErrorType.BadRequest);
  });

  test('Error: create missing identifier', async () => {
    const result = await Auth.createPrincipal(context, 'test', '');
    expect(result.isError() && result.error).toEqual(ErrorType.BadRequest);
  });
});

describe('createSessionForPrincipal', () => {
  test('Use existing principal', async () => {
    const identifier = randomIdentifier();
    const result = await Auth.createPrincipal(context, 'test', identifier);
    expect(result.isOk()).toBeTruthy();

    const session = await Auth.createSessionForPrincipal(context, 'test', identifier);
    expect(session.isOk()).toBeTruthy();
    if (session.isOk()) {
      expect(typeof session.value.subjectId).toBe('number');
    }
  });

  test('Error: missing provider', async () => {
    const identifier = randomIdentifier();
    const session = await Auth.createSessionForPrincipal(context, '', identifier);
    expect(session.isError() && session.error).toEqual(ErrorType.BadRequest);
  });

  test('Error: missing identifier', async () => {
    const session = await Auth.createSessionForPrincipal(context, 'test', '');
    expect(session.isError() && session.error).toEqual(ErrorType.BadRequest);
  });

  test('Error: non-existent principal', async () => {
    const result = await Auth.createSessionForPrincipal(context, 'test', randomIdentifier());
    expect(result.isError() && result.error).toEqual(ErrorType.NotFound);
  });
});
