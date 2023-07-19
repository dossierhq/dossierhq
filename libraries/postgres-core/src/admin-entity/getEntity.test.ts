import { AdminEntityStatus } from '@dossierhq/core';
import { expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import { createMockAdapter, createMockContext, getQueryCalls } from '../test/TestUtils.js';
import { adminGetEntity } from './getEntity.js';

describe('adminGetEntity', () => {
  test('Get latest version', async () => {
    const now = new Date();
    const adapter = createMockAdapter();
    const context = createMockContext(adapter);
    adapter.query.mockImplementation((_transaction, query, _values) => {
      let result;
      if (query.startsWith('SELECT e.uuid')) {
        result = {
          rows: [
            {
              uuid: '123',
              type: 'TitleOnly',
              name: 'Name',
              auth_key: 'authKey-123',
              resolved_auth_key: 'resolvedAuthKey-123',
              created_at: now,
              updated_at: now,
              status: 'modified',
              valid: true,
              version: 2,
              schema_version: 1,
              data: { title: 'Title' },
            },
          ],
        };
      } else {
        result = { rows: [] };
      }
      return Promise.resolve(result);
    });

    const result = await adminGetEntity(adapter, context, { id: '123' });

    expectResultValue(result, {
      id: '123',
      name: 'Name',
      type: 'TitleOnly',
      version: 2,
      status: AdminEntityStatus.modified,
      valid: true,
      validPublished: true,
      authKey: 'authKey-123',
      resolvedAuthKey: 'resolvedAuthKey-123',
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
      fieldValues: { title: 'Title' },
    });
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      [
        [
          "SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.invalid, ev.version, ev.schema_version, ev.data FROM entities e, entity_versions ev WHERE e.uuid = $1 AND e.latest_draft_entity_versions_id = ev.id",
          "123",
        ],
      ]
    `);
  });

  test('Get specific version', async () => {
    const now = new Date();
    const adapter = createMockAdapter();
    const context = createMockContext(adapter);
    adapter.query.mockImplementation((_transaction, query, _values) => {
      let result;
      if (query.startsWith('SELECT e.uuid')) {
        result = {
          rows: [
            {
              uuid: '123',
              type: 'TitleOnly',
              name: 'Name',
              auth_key: 'authKey-123',
              resolved_auth_key: 'resolvedAuthKey-123',
              created_at: now,
              updated_at: now,
              status: 'modified',
              valid: true,
              version: 5,
              schema_version: 1,
              data: { title: 'Title' },
            },
          ],
        };
      } else {
        result = { rows: [] };
      }
      return Promise.resolve(result);
    });

    const result = await adminGetEntity(adapter, context, { id: '123', version: 5 });

    expectResultValue(result, {
      id: '123',
      name: 'Name',
      type: 'TitleOnly',
      version: 5,
      status: AdminEntityStatus.modified,
      valid: true,
      validPublished: true,
      authKey: 'authKey-123',
      resolvedAuthKey: 'resolvedAuthKey-123',
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
      fieldValues: { title: 'Title' },
    });
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      [
        [
          "SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.invalid, ev.version, ev.schema_version, ev.data
          FROM entities e, entity_versions ev
          WHERE e.uuid = $1
          AND e.id = ev.entities_id
          AND ev.version = $2",
          "123",
          5,
        ],
      ]
    `);
  });
});
