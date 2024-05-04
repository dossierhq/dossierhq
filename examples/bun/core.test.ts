import { copyEntity, EntityStatus, type Entity } from '@dossierhq/core';
import { expect, test } from 'bun:test';

test('copyEntity()', () => {
  const original: Entity = {
    id: '123',
    info: {
      type: 'Foo',
      name: 'Hello',
      version: 1,
      authKey: '',
      status: EntityStatus.draft,
      valid: true,
      validPublished: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    fields: { title: 'message' },
  };

  const copy = copyEntity(original, { fields: { title: 'hello' } });
  expect(copy).toEqual({ ...original, fields: { title: 'hello' } });
});
