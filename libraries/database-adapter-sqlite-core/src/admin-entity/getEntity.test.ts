import { AdminEntityStatus } from '@dossierhq/core';
import { expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import {
  createMockContext,
  createMockInnerAndOuterAdapter,
  getRunAndQueryCalls,
} from '../test/TestUtils.js';

describe('adminGetEntity', () => {
  test('Get latest version', async () => {
    const now = new Date();
    const { innerAdapter, outerAdapter } = (await createMockInnerAndOuterAdapter()).valueOrThrow();
    const context = createMockContext(outerAdapter);

    innerAdapter.clearAllQueries();
    innerAdapter.mockQuery = (query, _values) => {
      if (query.startsWith('SELECT e.uuid'))
        return [
          {
            uuid: '123',
            type: 'TitleOnly',
            name: 'Name',
            auth_key: 'authKey-123',
            resolved_auth_key: 'resolvedAuthKey-123',
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
            status: 'modified',
            version: 2,
            fields: '{ "title": "Title" }',
          },
        ];
      return [];
    };

    const result = await outerAdapter.adminEntityGetOne(context, { id: '123' });

    expectResultValue(result, {
      id: '123',
      name: 'Name',
      type: 'TitleOnly',
      version: 2,
      status: AdminEntityStatus.modified,
      authKey: 'authKey-123',
      resolvedAuthKey: 'resolvedAuthKey-123',
      createdAt: now,
      updatedAt: now,
      fieldValues: { title: 'Title' },
    });
    expect(getRunAndQueryCalls(innerAdapter)).toMatchInlineSnapshot(`
      [
        [
          "SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields FROM entities e, entity_versions ev WHERE e.uuid = ?1 AND e.latest_entity_versions_id = ev.id",
          "123",
        ],
      ]
    `);
  });

  test('Get specific version', async () => {
    const now = new Date();
    const { innerAdapter, outerAdapter } = (await createMockInnerAndOuterAdapter()).valueOrThrow();
    const context = createMockContext(outerAdapter);

    innerAdapter.clearAllQueries();
    innerAdapter.mockQuery = (query, _values) => {
      if (query.startsWith('SELECT e.uuid'))
        return [
          {
            uuid: '123',
            type: 'TitleOnly',
            name: 'Name',
            auth_key: 'authKey-123',
            resolved_auth_key: 'resolvedAuthKey-123',
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
            status: 'modified',
            version: 5,
            fields: '{ "title": "Title" }',
          },
        ];
      return [];
    };

    const result = await outerAdapter.adminEntityGetOne(context, { id: '123', version: 5 });

    expectResultValue(result, {
      id: '123',
      name: 'Name',
      type: 'TitleOnly',
      version: 5,
      status: AdminEntityStatus.modified,
      authKey: 'authKey-123',
      resolvedAuthKey: 'resolvedAuthKey-123',
      createdAt: now,
      updatedAt: now,
      fieldValues: { title: 'Title' },
    });
    expect(getRunAndQueryCalls(innerAdapter)).toMatchInlineSnapshot(`
      [
        [
          "SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
          FROM entities e, entity_versions ev
          WHERE e.uuid = ?1
          AND e.id = ev.entities_id
          AND ev.version = ?2",
          "123",
          5,
        ],
      ]
    `);
  });
});
