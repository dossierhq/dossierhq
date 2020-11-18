import type { Instance } from '.';
import { createTestInstance } from './TestUtils';

let instance: Instance;

beforeAll(async () => {
  instance = await createTestInstance({ loadSchema: false });
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
