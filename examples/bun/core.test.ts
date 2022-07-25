import { AdminEntity, AdminEntityStatus, copyEntity } from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import { expect, test } from 'bun:test';

test('copyEntity()', () => {
  const original: AdminEntity = {
    id: '123',
    info: {
      type: 'Foo',
      name: 'Hello',
      version: 0,
      authKey: 'none',
      status: AdminEntityStatus.draft,
      createdAt: Temporal.Now.instant(),
      updatedAt: Temporal.Now.instant(),
    },
    fields: { title: 'message' },
  };

  const copy = copyEntity(original, { fields: { title: 'hello' } });
  //TODO no deep equals in bun just yet, so use JSON instead
  expect(JSON.stringify(copy)).toBe(JSON.stringify({ ...original, fields: { title: 'hello' } }));
});
