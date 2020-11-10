import { Auth, AuthContext, Instance } from '.';
import TestInstance from '../test/TestInstance';
import { Errors } from '.';

let instance: Instance;
let context: AuthContext;

beforeAll(() => {
  instance = TestInstance.createInstance();
  context = instance.createAuthContext();
});
afterAll(async () => {
  await instance.shutdown();
});

describe('createPrincipal', () => {
  test('Create test/new-identifier', async () => {
    const result = await Auth.createPrincipal(context, 'test', Math.random().toString());
    expect(result.isOk()).toBeTruthy();
    if (result.isOk()) {
      expect(result.value).toMatch(
        /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/
      );
    }
  });

  test('Create duplicate fails', async () => {
    const identifier = Math.random().toString();
    const firstResult = await Auth.createPrincipal(context, 'test', identifier);
    expect(firstResult.isOk());

    const secondResult = await Auth.createPrincipal(context, 'test', identifier);
    expect(secondResult).toEqual(Errors.Conflict);
  });

  test('Error: create missing provider', async () => {
    const identifier = Math.random().toString();
    const result = await Auth.createPrincipal(context, '', identifier);
    expect(result).toEqual(Errors.BadRequest);
  });

  test('Error: create missing identifier', async () => {
    const result = await Auth.createPrincipal(context, 'test', '');
    expect(result).toEqual(Errors.BadRequest);
  });
});
