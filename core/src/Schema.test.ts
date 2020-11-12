import type { Instance } from '.';
import TestInstance from '../test/TestInstance';

let instance: Instance;

beforeAll(async () => {
  instance = await TestInstance.createInstance({ loadSchema: false });
});
afterAll(async () => {
  await instance.shutdown();
});

describe('Instance.reloadSchema()', () => {
  test('Load', async () => {
    await instance.reloadSchema(instance.createAuthContext());
    const schema = instance.getSchema();
    expect(schema.spec).toBeTruthy();
  });
});
