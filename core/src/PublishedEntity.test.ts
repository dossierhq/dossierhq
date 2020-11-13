import type { Instance, SessionContext } from '.';
import { ErrorType, PublishedEntity } from '.';
import TestInstance from '../test/TestInstance';
import { ensureSessionContext, expectErrorResult } from '../test/TestUtils';

let instance: Instance;
let context: SessionContext;

beforeAll(async () => {
  instance = await TestInstance.createInstance({ loadSchema: true });
  context = await ensureSessionContext(instance, 'test', 'published-entity');
});
afterAll(async () => {
  await instance.shutdown();
});

describe('getEntity()', () => {
  test('Error: Get invalid id', async () => {
    const result = await PublishedEntity.getEntity(context, 'f09fdd62-4a1e-4320-afba-8dd0781799df');
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });
});
