import type { AdminEntity } from '@dossierhq/core';
import { AdminEntityStatus, copyEntity } from '@dossierhq/core';
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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    fields: { title: 'message' },
  };

  const copy = copyEntity(original, { fields: { title: 'hello' } });
  expect(copy).toEqual({ ...original, fields: { title: 'hello' } });
});
