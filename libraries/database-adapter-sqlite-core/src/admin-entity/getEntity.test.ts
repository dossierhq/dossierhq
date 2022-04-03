import { AdminEntityStatus } from '@jonasb/datadata-core';
import { expectResultValue } from '@jonasb/datadata-core-jest';
import { Temporal } from '@js-temporal/polyfill';
import {
  createMockContext,
  createMockInnerAndOuterAdapter,
  getQueryCalls,
} from '../test/TestUtils';

describe('adminGetEntity', () => {
  test('Get latest version', async () => {
    const now = Temporal.Now.instant();
    const { innerAdapter, outerAdapter } = (await createMockInnerAndOuterAdapter()).valueOrThrow();
    const context = createMockContext(outerAdapter);

    innerAdapter.query.mockClear();
    innerAdapter.query.mockImplementation(async (query, _values) => {
      if (query.startsWith('SELECT e.uuid'))
        return [
          {
            uuid: '123',
            type: 'TitleOnly',
            name: 'Name',
            auth_key: 'authKey-123',
            resolved_auth_key: 'resolvedAuthKey-123',
            created_at: now.toString(),
            updated_at: now.toString(),
            status: 'modified',
            version: 2,
            fields: '{ "title": "Title" }',
          },
        ];
      return [];
    });

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
    expect(getQueryCalls(innerAdapter)).toMatchInlineSnapshot(`
      Array [
        Array [
          "SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
            FROM entities e, entity_versions ev
            WHERE e.uuid = ?1 AND e.latest_entity_versions_id = ev.id",
          "123",
        ],
      ]
    `);
  });

  test('Get specific version', async () => {
    const now = Temporal.Now.instant();
    const { innerAdapter, outerAdapter } = (await createMockInnerAndOuterAdapter()).valueOrThrow();
    const context = createMockContext(outerAdapter);

    innerAdapter.query.mockClear();
    innerAdapter.query.mockImplementation(async (query, _values) => {
      if (query.startsWith('SELECT e.uuid'))
        return [
          {
            uuid: '123',
            type: 'TitleOnly',
            name: 'Name',
            auth_key: 'authKey-123',
            resolved_auth_key: 'resolvedAuthKey-123',
            created_at: now.toString(),
            updated_at: now.toString(),
            status: 'modified',
            version: 5,
            fields: '{ "title": "Title" }',
          },
        ];
      return [];
    });

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
    expect(getQueryCalls(innerAdapter)).toMatchInlineSnapshot(`
      Array [
        Array [
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
