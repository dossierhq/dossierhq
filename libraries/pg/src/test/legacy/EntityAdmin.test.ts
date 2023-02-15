import type { AdminClient, AdminEntity, AdminEntityCreate, PublishedClient } from '@dossierhq/core';
import {
  AdminEntityStatus,
  copyEntity,
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextNode,
  createRichTextValueItemNode,
  ErrorType,
  FieldType,
  PublishingEventKind,
} from '@dossierhq/core';
import { expectErrorResult, expectOkResult, expectResultValue } from '@dossierhq/core-vitest';
import type { Server, SessionContext } from '@dossierhq/server';
import { validate as validateUuid } from 'uuid';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  createPostgresTestServerAndClient,
  expectEntityHistoryVersions,
  expectSearchResultEntities,
  insecureTestUuidv4,
} from '../TestUtils.js';
import {
  countSearchResultWithEntity,
  ensureEntityCount,
  ensureEntityWithStatus,
  getAllEntities,
  randomBoundingBox,
} from './EntitySearchTestUtils.js';

let server: Server;
let context: SessionContext;
let client: AdminClient;
let adminClientOther: AdminClient;
let publishedClient: PublishedClient;
let entitiesOfTypeAdminOnlyEditBeforeNone: AdminEntity[];

const emptyFooFields = { bar: null, summary: null, title: null };
const emptyBazFields = {
  active: null,
  activeList: null,
  bar: null,
  bars: null,
  baz: null,
  body: null,
  bodyList: null,
  booleanString: null,
  listFields: null,
  listFieldsList: null,
  location: null,
  locations: null,
  nested: null,
  oneString: null,
  stringReference: null,
  tags: null,
  title: null,
  twoStrings: null,
  twoStringsList: null,
  valueItem: null,
};

beforeAll(async () => {
  const result = await createPostgresTestServerAndClient();
  if (result.isError()) throw result.toError();
  server = result.value.server;
  context = result.value.context;
  client = server.createAdminClient(context);

  const sessionOtherResult = server.createSession({
    provider: 'test',
    identifier: 'other',
    defaultAuthKeys: ['none'],
  });
  adminClientOther = server.createAdminClient(() => sessionOtherResult);

  publishedClient = server.createPublishedClient(context);
  await client.updateSchemaSpecification({
    entityTypes: [
      {
        name: 'EntityAdminFoo',
        nameField: 'title',
        fields: [
          { name: 'title', type: FieldType.String, required: true },
          { name: 'summary', type: FieldType.String },
          { name: 'bar', type: FieldType.Entity, entityTypes: ['EntityAdminBar'] },
        ],
      },
      { name: 'EntityAdminBar', fields: [{ name: 'title', type: FieldType.String }] },
      {
        name: 'EntityAdminBaz',
        fields: [
          { name: 'title', type: FieldType.String },
          { name: 'bar', type: FieldType.Entity, entityTypes: ['EntityAdminBar'] },
          { name: 'baz', type: FieldType.Entity, entityTypes: ['EntityAdminBaz'] },
          { name: 'tags', type: FieldType.String, list: true },
          { name: 'active', type: FieldType.Boolean },
          { name: 'activeList', type: FieldType.Boolean, list: true },
          { name: 'body', type: FieldType.RichText },
          { name: 'bodyList', type: FieldType.RichText, list: true },
          { name: 'location', type: FieldType.Location },
          { name: 'locations', type: FieldType.Location, list: true },
          {
            name: 'bars',
            type: FieldType.Entity,
            list: true,
            entityTypes: ['EntityAdminBar'],
          },
          {
            name: 'oneString',
            type: FieldType.ValueItem,
            valueTypes: ['EntityAdminOneString'],
          },
          {
            name: 'twoStrings',
            type: FieldType.ValueItem,
            valueTypes: ['EntityAdminTwoStrings'],
          },
          {
            name: 'twoStringsList',
            type: FieldType.ValueItem,
            valueTypes: ['EntityAdminTwoStrings'],
            list: true,
          },
          {
            name: 'booleanString',
            type: FieldType.ValueItem,
            valueTypes: ['EntityAdminBooleanString'],
          },
          {
            name: 'stringReference',
            type: FieldType.ValueItem,
            valueTypes: ['EntityAdminStringReference'],
          },
          {
            name: 'listFields',
            type: FieldType.ValueItem,
            valueTypes: ['EntityAdminListFields'],
          },
          {
            name: 'listFieldsList',
            type: FieldType.ValueItem,
            list: true,
            valueTypes: ['EntityAdminListFields'],
          },
          {
            name: 'nested',
            type: FieldType.ValueItem,
            valueTypes: ['EntityAdminNested'],
          },
          {
            name: 'valueItem',
            type: FieldType.ValueItem,
          },
        ],
      },
      {
        name: 'EntityAdminQux',
        adminOnly: true,
        fields: [{ name: 'title', type: FieldType.String }],
      },
      { name: 'AdminOnlyEditBefore', fields: [{ name: 'message', type: FieldType.String }] },
    ],
    valueTypes: [
      {
        name: 'EntityAdminOneString',
        fields: [{ name: 'one', type: FieldType.String, required: true }],
      },
      {
        name: 'EntityAdminTwoStrings',
        fields: [
          { name: 'one', type: FieldType.String },
          { name: 'two', type: FieldType.String },
        ],
      },
      {
        name: 'EntityAdminBooleanString',
        fields: [
          { name: 'boolean', type: FieldType.Boolean },
          { name: 'string', type: FieldType.String },
        ],
      },
      {
        name: 'EntityAdminStringReference',
        fields: [
          { name: 'string', type: FieldType.String },
          { name: 'reference', type: FieldType.Entity, entityTypes: ['EntityAdminBar'] },
        ],
      },
      {
        name: 'EntityAdminListFields',
        fields: [
          { name: 'stringList', type: FieldType.String, list: true },
          {
            name: 'referenceList',
            type: FieldType.Entity,
            list: true,
            entityTypes: ['EntityAdminBar'],
          },
        ],
      },
      {
        name: 'EntityAdminStringedLocation',
        fields: [
          { name: 'string', type: FieldType.String },
          {
            name: 'location',
            type: FieldType.Location,
          },
        ],
      },
      {
        name: 'EntityAdminNested',
        fields: [
          { name: 'title', type: FieldType.String },
          {
            name: 'child',
            type: FieldType.ValueItem,
            valueTypes: ['EntityAdminNested'],
          },
        ],
      },
      {
        name: 'EntityAdminOneStringAdminOnly',
        adminOnly: true,
        fields: [{ name: 'one', type: FieldType.String, required: true }],
      },
    ],
  });

  await ensureEntitiesExistForAdminOnlyEditBefore(client, 'none');
  entitiesOfTypeAdminOnlyEditBeforeNone = await getEntitiesForAdminOnlyEditBefore(client, 'none');
});
afterAll(async () => {
  await server.shutdown();
});

async function ensureEntitiesExistForAdminOnlyEditBefore(client: AdminClient, authKey: string) {
  (
    await ensureEntityCount(client, 50, 'AdminOnlyEditBefore', authKey, (random) => ({
      message: `Hey ${random}`,
    }))
  ).throwIfError();

  for (const status of [
    AdminEntityStatus.draft,
    AdminEntityStatus.published,
    AdminEntityStatus.modified,
    AdminEntityStatus.withdrawn,
    AdminEntityStatus.archived,
  ]) {
    (
      await ensureEntityWithStatus(client, 'AdminOnlyEditBefore', authKey, status, (random) => ({
        message: `Hey ${random}`,
      }))
    ).throwIfError();
  }
}

async function getEntitiesForAdminOnlyEditBefore(client: AdminClient, authKey: string) {
  const result = await getAllEntities(client, {
    authKeys: [authKey],
    entityTypes: ['AdminOnlyEditBefore'],
  });
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

async function createBarWithFooBazReferences(
  fooCount: number,
  bazCount: number,
  bazReferencesPerEntity = 1
) {
  const createBarResult = await client.createEntity({
    info: { type: 'EntityAdminBar', name: 'Bar', authKey: 'none' },
    fields: { title: 'Bar' },
  });
  if (createBarResult.isError()) {
    throw createBarResult.toError();
  }

  const {
    entity: { id: barId },
  } = createBarResult.value;

  const fooEntities: AdminEntity[] = [];
  const bazEntities: AdminEntity[] = [];

  for (let i = 0; i < fooCount; i += 1) {
    const createFooResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo: ' + i, authKey: 'none' },
      fields: { bar: { id: barId } },
    });
    if (expectOkResult(createFooResult)) {
      fooEntities.push(createFooResult.value.entity);
    }
  }
  for (let i = 0; i < bazCount; i += 1) {
    const bars = [...new Array(bazReferencesPerEntity - 1)].map(() => ({ id: barId }));
    const createBazResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz: ' + i, authKey: 'none' },
      fields: { bar: { id: barId }, bars },
    });
    if (expectOkResult(createBazResult)) {
      bazEntities.push(createBazResult.value.entity);
    }
  }
  return { barId, fooEntities, bazEntities };
}

describe('createEntity()', () => {
  test('Create EntityAdminFoo and publish', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo', authKey: 'none' },
      fields: { title: 'Title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;
      expect(validateUuid(id)).toBeTruthy();
      expect(name).toMatch(/^Foo(#[0-9]+)?$/);

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 0,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt,
        },
        fields: { ...emptyFooFields, title: 'Title' },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, status: AdminEntityStatus.published, effect: 'published', updatedAt },
        ]);

        expectedEntity.info.status = AdminEntityStatus.published;
        expectedEntity.info.updatedAt = updatedAt;
      }

      const historyResult = await client.getEntityHistory({ id });
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            published: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await client.getEntity({ id, version: 0 });
      expectResultValue(version0Result, expectedEntity);

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: { type: 'EntityAdminFoo', name, authKey: 'none', createdAt },
        fields: { ...emptyFooFields, title: 'Title' },
      });
    }
  });

  test('Create EntityAdminFoo w/o publish', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Draft', authKey: 'none' },
      fields: { title: 'Draft' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;
      expect(validateUuid(id)).toBeTruthy();

      expectResultValue(createResult, {
        effect: 'created',
        entity: {
          id,
          info: {
            type: 'EntityAdminFoo',
            name,
            version: 0,
            authKey: 'none',
            status: AdminEntityStatus.draft,
            createdAt,
            updatedAt,
          },
          fields: { ...emptyFooFields, title: 'Draft' },
        },
      });

      const historyResult = await client.getEntityHistory({ id });
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            published: false,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await client.getEntity({ id, version: 0 });
      expectResultValue(version0Result, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 0,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt,
        },
        fields: { ...emptyFooFields, title: 'Draft' },
      });

      const publishedResult = await publishedClient.getEntity({ id });
      expectErrorResult(publishedResult, ErrorType.NotFound, 'No such entity');
    }
  });

  test('Create EntityAdminFoo with id', async () => {
    const id = insecureTestUuidv4();
    const createResult = await client.createEntity({
      id,
      info: { type: 'EntityAdminFoo', name: 'Draft', authKey: 'none' },
      fields: { title: 'Draft' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;
      expectResultValue(createResult, {
        effect: 'created',
        entity: {
          id,
          info: {
            type: 'EntityAdminFoo',
            name,
            version: 0,
            authKey: 'none',
            status: AdminEntityStatus.draft,
            createdAt,
            updatedAt,
          },
          fields: { ...emptyFooFields, title: 'Draft' },
        },
      });
    }
  });

  test('Create EntityAdminFoo normalizes empty string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Draft', authKey: 'none' },
      fields: { title: '' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          fields: { title },
        },
      } = createResult.value;
      expect(title).toBe(null);
    }
  });

  test('Create EntityAdminFoo normalizes empty value item', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Draft', authKey: 'none' },
      fields: { twoStrings: { type: 'EntityAdminTwoStrings' } },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          version: 0,
          name,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          twoStrings: { type: 'EntityAdminTwoStrings', one: null, two: null },
        },
      };

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminFoo with reference to Bar', async () => {
    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name', authKey: 'none' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: { id: barId },
      } = createBarResult.value;

      const createFooResult = await client.createEntity({
        info: { type: 'EntityAdminFoo', name: 'Foo name', authKey: 'none' },
        fields: { title: 'Foo title', bar: { id: barId } },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: {
            id: fooId,
            info: { name, createdAt, updatedAt },
          },
        } = createFooResult.value;
        expect(validateUuid(fooId)).toBeTruthy();

        const expectedFooEntity: AdminEntity = {
          id: fooId,
          info: {
            type: 'EntityAdminFoo',
            name,
            version: 0,
            authKey: 'none',
            status: AdminEntityStatus.draft,
            createdAt,
            updatedAt,
          },
          fields: {
            ...emptyFooFields,
            title: 'Foo title',
            bar: { id: barId },
          },
        };

        expectResultValue(createFooResult, {
          effect: 'created',
          entity: expectedFooEntity,
        });

        const publishResult = await client.publishEntities([
          { id: fooId, version: 0 },
          { id: barId, version: 0 },
        ]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt: fooUpdatedAt }, { updatedAt: barUpdatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            {
              id: fooId,
              status: AdminEntityStatus.published,
              effect: 'published',
              updatedAt: fooUpdatedAt,
            },
            {
              id: barId,
              status: AdminEntityStatus.published,
              effect: 'published',
              updatedAt: barUpdatedAt,
            },
          ]);

          expectedFooEntity.info.status = AdminEntityStatus.published;
          expectedFooEntity.info.updatedAt = fooUpdatedAt;
        }

        const fooVersion0Result = await client.getEntity({ id: fooId, version: 0 });
        expectResultValue(fooVersion0Result, expectedFooEntity);

        const publishedFooResult = await publishedClient.getEntity({ id: fooId });
        expectResultValue(publishedFooResult, {
          id: fooId,
          info: {
            type: 'EntityAdminFoo',
            name,
            authKey: 'none',
            createdAt,
          },
          fields: {
            ...emptyFooFields,
            title: 'Foo title',
            bar: { id: barId },
          },
        });
      }
    }
  });

  test('Create EntityAdminBaz with string list', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: { tags: ['one', 'two', 'three'] },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt,
        },
        fields: { ...emptyBazFields, tags: ['one', 'two', 'three'] },
      };

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      if (expectOkResult(getResult)) {
        expectResultValue(getResult, expectedEntity);
      }
    }
  });

  test('Create EntityAdminBaz with boolean and boolean list', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: { active: true, activeList: [true, false, true] },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt,
        },
        fields: { ...emptyBazFields, active: true, activeList: [true, false, true] },
      };

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with location and location list', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        location: { lat: 55.60498, lng: 13.003822 },
        locations: [
          { lat: 55.60498, lng: 13.003822 },
          { lat: 56.381561, lng: 13.99286 },
        ],
      },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          location: { lat: 55.60498, lng: 13.003822 },
          locations: [
            { lat: 55.60498, lng: 13.003822 },
            { lat: 56.381561, lng: 13.99286 },
          ],
        },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with reference list', async () => {
    const createBar1Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar1', authKey: 'none' },
      fields: {},
    });
    const createBar2Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar2', authKey: 'none' },
      fields: {},
    });

    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const {
        entity: { id: bar1Id },
      } = createBar1Result.value;
      const {
        entity: { id: bar2Id },
      } = createBar2Result.value;

      const createBazResult = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
        fields: { bars: [{ id: bar1Id }, { id: bar2Id }] },
      });
      if (expectOkResult(createBazResult)) {
        const { entity: baz } = createBazResult.value;
        const {
          entity: {
            id,
            info: { name, createdAt, updatedAt },
          },
        } = createBazResult.value;

        const expectedEntity: AdminEntity = {
          id,
          info: {
            type: 'EntityAdminBaz',
            name: name,
            version: 0,
            authKey: 'none',
            status: AdminEntityStatus.draft,
            createdAt,
            updatedAt,
          },
          fields: { ...emptyBazFields, bars: [{ id: bar1Id }, { id: bar2Id }] },
        };

        expectResultValue(createBazResult, { effect: 'created', entity: expectedEntity });

        const getResult = await client.getEntity({ id });
        expectResultValue(getResult, expectedEntity);

        const referencesTo1 = await client.searchEntities({ linksTo: { id: bar1Id } });
        expectSearchResultEntities(referencesTo1, [baz]);

        const referencesTo2 = await client.searchEntities({ linksTo: { id: bar2Id } });
        expectSearchResultEntities(referencesTo2, [baz]);
      }
    }
  });

  test('Create EntityAdminBaz with EntityAdminTwoStrings value type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: { twoStrings: { type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' } },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          twoStrings: { type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
        },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with list of EntityAdminTwoStrings value type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        twoStringsList: [
          { type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
          { type: 'EntityAdminTwoStrings', one: 'Three', two: 'Four' },
        ],
      },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          twoStringsList: [
            { type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
            { type: 'EntityAdminTwoStrings', one: 'Three', two: 'Four' },
          ],
        },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with EntityAdminBooleanString value type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        booleanString: { type: 'EntityAdminBooleanString', boolean: true, string: 'String' },
      },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          booleanString: { type: 'EntityAdminBooleanString', boolean: true, string: 'String' },
        },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with EntityAdminStringReference value type', async () => {
    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar', authKey: 'none' },
      fields: {},
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: { id: barId },
      } = createBarResult.value;

      const createBazResult = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
        fields: {
          stringReference: {
            type: 'EntityAdminStringReference',
            string: 'Hello string',
            reference: { id: barId },
          },
        },
      });
      if (expectOkResult(createBazResult)) {
        const { entity: baz } = createBazResult.value;
        const {
          entity: {
            id: bazId,
            info: { name: bazName, createdAt, updatedAt },
          },
        } = createBazResult.value;

        const expectedEntity: AdminEntity = {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: bazName,
            version: 0,
            authKey: 'none',
            status: AdminEntityStatus.draft,
            createdAt,
            updatedAt,
          },
          fields: {
            ...emptyBazFields,
            stringReference: {
              type: 'EntityAdminStringReference',
              string: 'Hello string',
              reference: { id: barId },
            },
          },
        };

        expectResultValue(createBazResult, { effect: 'created', entity: expectedEntity });

        const getResult = await client.getEntity({ id: bazId });
        expectResultValue(getResult, expectedEntity);

        const barReferences = await client.searchEntities({ linksTo: { id: barId } });
        expectSearchResultEntities(barReferences, [baz]);
      }
    }
  });

  test('Create EntityAdminBaz with EntityAdminListFields value type', async () => {
    const createBar1Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar 1', authKey: 'none' },
      fields: {},
    });
    const createBar2Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar 2', authKey: 'none' },
      fields: {},
    });
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const {
        entity: { id: bar1Id },
      } = createBar1Result.value;
      const {
        entity: { id: bar2Id },
      } = createBar2Result.value;

      const createBazResult = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
        fields: {
          listFields: {
            type: 'EntityAdminListFields',
            stringList: ['one', 'two', 'three'],
            referenceList: [{ id: bar1Id }, { id: bar2Id }],
          },
          listFieldsList: [
            {
              type: 'EntityAdminListFields',
              stringList: ['three', 'two', 'one'],
              referenceList: [{ id: bar2Id }, { id: bar1Id }],
            },
            {
              type: 'EntityAdminListFields',
              stringList: ['one', 'two', 'three'],
              referenceList: [{ id: bar1Id }, { id: bar2Id }],
            },
          ],
        },
      });
      if (expectOkResult(createBazResult)) {
        const {
          entity: {
            id: bazId,
            info: { name: bazName, createdAt, updatedAt },
          },
        } = createBazResult.value;

        const expectedEntity: AdminEntity = {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: bazName,
            version: 0,
            authKey: 'none',
            status: AdminEntityStatus.draft,
            createdAt,
            updatedAt,
          },
          fields: {
            ...emptyBazFields,
            listFields: {
              type: 'EntityAdminListFields',
              stringList: ['one', 'two', 'three'],
              referenceList: [{ id: bar1Id }, { id: bar2Id }],
            },
            listFieldsList: [
              {
                type: 'EntityAdminListFields',
                stringList: ['three', 'two', 'one'],
                referenceList: [{ id: bar2Id }, { id: bar1Id }],
              },
              {
                type: 'EntityAdminListFields',
                stringList: ['one', 'two', 'three'],
                referenceList: [{ id: bar1Id }, { id: bar2Id }],
              },
            ],
          },
        };

        expectResultValue(createBazResult, { effect: 'created', entity: expectedEntity });

        const getResult = await client.getEntity({ id: bazId });
        expectResultValue(getResult, expectedEntity);

        const bar1References = await client.searchEntities({ linksTo: { id: bar1Id } });

        expect(
          bar1References.isOk() &&
            bar1References.value?.edges.map((x) => (x.node.isOk() ? x.node.value.id : null))
        ).toEqual([bazId]);

        const bar2References = await client.searchEntities({ linksTo: { id: bar2Id } });

        expect(
          bar2References.isOk() &&
            bar2References.value?.edges.map((x) => (x.node.isOk() ? x.node.value.id : null))
        ).toEqual([bazId]);
      }
    }
  });

  test('Create EntityAdminBaz with EntityAdminNested value type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        nested: {
          type: 'EntityAdminNested',
          title: 'Nested 0',
          child: {
            type: 'EntityAdminNested',
            title: 'Nested 0.a',
            child: {
              type: 'EntityAdminNested',
              title: 'Nested 0.a.I',
            },
          },
        },
      },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id: bazId,
          info: { name: bazName, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id: bazId,
        info: {
          type: 'EntityAdminBaz',
          name: bazName,
          version: 0,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          nested: {
            type: 'EntityAdminNested',
            title: 'Nested 0',
            child: {
              type: 'EntityAdminNested',
              title: 'Nested 0.a',
              child: {
                type: 'EntityAdminNested',
                title: 'Nested 0.a.I',
                child: null,
              },
            },
          },
        },
      };

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id: bazId });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Error: Create with already existing', async () => {
    const firstCreateResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo', authKey: 'none' },
      fields: { title: 'First' },
    });

    if (expectOkResult(firstCreateResult)) {
      const {
        entity: { id },
      } = firstCreateResult.value;

      const secondCreateResult = await client.createEntity({
        id,
        info: { type: 'EntityAdminBar', name: 'Bar', authKey: 'none' },
        fields: { title: 'Second' },
      });

      expectErrorResult(
        secondCreateResult,
        ErrorType.Conflict,
        `Entity with id (${id}) already exist`
      );
    }
  });

  test('Error: Create without name', async () => {
    const result = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: '', authKey: 'none' },
      fields: { title: 'title' },
    });

    expectErrorResult(result, ErrorType.BadRequest, 'Missing entity.info.name');
  });

  test('Error: Create with invalid version', async () => {
    const result = await client.createEntity({
      info: {
        type: 'EntityAdminFoo',
        name: 'Foo',
        authKey: 'none',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        version: 1 as any,
      },
      fields: {},
    });

    expectErrorResult(result, ErrorType.BadRequest, 'Unsupported version for create: 1');
  });

  test('Error: Create without authKey', async () => {
    const result = await client.createEntity({
      info: {
        type: 'EntityAdminFoo',
        name: 'Foo',
      },
      fields: {},
    } as AdminEntityCreate);

    expectErrorResult(result, ErrorType.BadRequest, 'Missing entity.info.authKey');
  });

  test('Error: Using authKey where adapter returns error', async () => {
    const result = await client.createEntity({
      info: {
        type: 'EntityAdminFoo',
        name: 'Foo',
        authKey: 'unauthorized',
      },
      fields: {},
    });

    expectErrorResult(
      result,
      ErrorType.NotAuthorized,
      'User not authorized to use authKey unauthorized'
    );
  });

  test('Error: Create with invalid field', async () => {
    const result = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo', authKey: 'none' },
      fields: { invalid: 'hello' },
    });

    expectErrorResult(result, ErrorType.BadRequest, 'Unsupported field names: invalid');
  });

  test('Error: Create EntityAdminFoo with reference to missing entity', async () => {
    const result = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name', authKey: 'none' },
      fields: { title: 'Foo title', bar: { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' } },
    });
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.fields.bar: Referenced entity (fcc46a9e-2097-4bd6-bb08-56d5f59db26b) doesn’t exist'
    );
  });

  test('Error: Create EntityAdminFoo with reference to wrong entity type', async () => {
    const referenceId = entitiesOfTypeAdminOnlyEditBeforeNone[0].id;
    const result = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name', authKey: 'none' },
      fields: {
        title: 'Foo title',
        bar: { id: referenceId },
      },
    });
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      `entity.fields.bar: Referenced entity (${referenceId}) has an invalid type AdminOnlyEditBefore`
    );
  });

  test('Error: Set string when expecting list of string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        tags: 'invalid',
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.tags: Expected list got string'
    );
  });

  test('Error: Set list of string when expecting string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        title: ['invalid', 'foo'],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.title: Expected single String got list'
    );
  });

  test('Error: Set reference when expecting list of references', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        bars: { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.bars: Expected list got object'
    );
  });

  test('Error: Set list of references when expecting reference', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        bar: [
          { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
          { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
        ],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.bar: Expected single Entity got list'
    );
  });

  test('Error: value type missing type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        twoStrings: { one: 'One', two: 'Two' },
      },
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.fields.twoStrings: Missing type');
  });

  test('Error: value type with invalid type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        twoStrings: { type: 'Invalid' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.twoStrings: Couldn’t find spec for value type Invalid'
    );
  });

  test('Error: value type with wrong type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        oneString: { type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.oneString: value of type EntityAdminTwoStrings is not allowed'
    );
  });

  test('Error: value type with invalid field', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        oneString: { type: 'EntityAdminOneString', one: 'One', invalid: 'value' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.oneString: Unsupported field names: invalid'
    );
  });

  test('Error: rich text single, where list is expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        bodyList: createRichTextRootNode([]),
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.bodyList: Expected list got object'
    );
  });

  test('Error: rich text list, where single is expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        body: [createRichTextRootNode([])],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.body: Expected single RichText got list'
    );
  });

  test('Error: rich text, forgotten root', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        body: createRichTextParagraphNode([createRichTextTextNode('')]),
      },
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.fields.body: Missing root');
  });

  test('Error: rich text with string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        body: 'Hello',
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.body: Expected object got string'
    );
  });

  test('Error: rich text without root', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        body: {},
      },
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.fields.body: Missing root');
  });

  test('Error: rich text, root as string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        body: { root: 'Hello' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.body: Expected object got string'
    );
  });

  test('Error: single location when list expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        locations: { lat: 55.60498, lng: 13.003822 },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.locations: Expected list got object'
    );
  });

  test('Error: location list when single item expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        location: [{ lat: 55.60498, lng: 13.003822 }],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.location: Expected single Location got list'
    );
  });

  test('Error: location with empty object', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        location: {},
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.location: expected {lat: number, lng: number}, got [object Object]'
    );
  });

  test('Error: single value type when list expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        twoStringsList: { type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.twoStringsList: Expected list got object'
    );
  });

  test('Error: list of value type when single item expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        twoStrings: [
          { type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
          { type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
        ],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.twoStrings: Expected single ValueItem got list'
    );
  });
});

describe('searchEntities() linksTo', () => {
  test('Query based on linksTo and entityTypes, one reference', async () => {
    const { barId, bazEntities } = await createBarWithFooBazReferences(1, 1);
    const [bazEntity] = bazEntities;

    const searchResult = await client.searchEntities({
      entityTypes: ['EntityAdminBaz'],
      linksTo: { id: barId },
    });
    expectSearchResultEntities(searchResult, [bazEntity]);
  });
});

describe('searchEntities() boundingBox', () => {
  test('Query based on bounding box for rich text', async () => {
    const boundingBox = randomBoundingBox();
    const center = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
    };

    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: {
        body: createRichTextRootNode([
          createRichTextValueItemNode({
            type: 'EntityAdminStringedLocation',
            string: 'Hello location',
            location: center,
          }),
        ]),
      },
    });

    if (expectOkResult(createResult)) {
      const {
        entity: { id: bazId },
      } = createResult.value;
      const matches = await countSearchResultWithEntity(client, { boundingBox }, bazId);
      expectResultValue(matches, 1);
    }
  });
});

describe('getTotalCount', () => {
  test('Query based on linksTo and entityTypes, one reference', async () => {
    const { barId } = await createBarWithFooBazReferences(1, 1);

    const result = await client.getTotalCount({
      entityTypes: ['EntityAdminBaz'],
      linksTo: { id: barId },
    });
    if (expectOkResult(result)) {
      expect(result.value).toBe(1);
    }
  });

  test('Query based on bounding box with two locations inside', async () => {
    const boundingBox = randomBoundingBox();
    const center = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
    };
    const inside = {
      lat: center.lat,
      lng: (center.lng + boundingBox.maxLng) / 2,
    };

    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz', authKey: 'none' },
      fields: { locations: [center, inside] },
    });

    if (expectOkResult(createResult)) {
      const searchResult = await client.searchEntities({ boundingBox });

      const totalResult = await client.getTotalCount({ boundingBox });
      if (expectOkResult(searchResult) && expectOkResult(totalResult)) {
        // Hopefully there aren't too many entities in the bounding box
        expect(searchResult.value?.pageInfo.hasNextPage).toBeFalsy();

        expect(totalResult.value).toBe(searchResult.value?.edges.length);
      }
    }
  });

  test('Query based on text', async () => {
    const resultBefore = await client.getTotalCount({ text: 'sensational clown' });
    if (expectOkResult(resultBefore)) {
      expectOkResult(
        await client.createEntity({
          info: { type: 'EntityAdminFoo', name: 'foo', authKey: 'none' },
          fields: { summary: 'That was indeed a sensational clown' },
        })
      );

      const resultAfter = await client.getTotalCount({ text: 'sensational clown' });
      if (expectOkResult(resultAfter)) {
        expect(resultAfter.value).toBe(resultBefore.value + 1);
      }
    }
  });
});

describe('updateEntity()', () => {
  test('Update EntityAdminFoo and publish', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Original', authKey: 'none' },
      fields: { title: 'Original' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { createdAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: createResult.value.entity.info.name,
          version: 0,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: {
          ...emptyFooFields,
          title: 'Original',
        },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const updateResult = await client.updateEntity({
        id,
        info: { type: 'EntityAdminFoo', name: 'Updated name' },
        fields: { title: 'Updated title' },
      });
      if (expectOkResult(updateResult)) {
        const {
          entity: {
            info: { name },
          },
        } = updateResult.value;
        expect(name).toMatch(/^Updated name(#[0-9]+)?$/);

        expectedEntity.info.name = name;
        expectedEntity.info.version = 1;
        expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
        expectedEntity.fields.title = 'Updated title';

        expectResultValue(updateResult, { effect: 'updated', entity: expectedEntity });

        const publishResult = await client.publishEntities([{ id, version: 1 }]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            { id, status: AdminEntityStatus.published, effect: 'published', updatedAt },
          ]);

          expectedEntity.info.status = AdminEntityStatus.published;
          expectedEntity.info.updatedAt = updatedAt;
        }

        const historyResult = await client.getEntityHistory({ id });
        if (expectOkResult(historyResult)) {
          expectEntityHistoryVersions(historyResult.value, [
            {
              version: 0,
              published: false,
              createdBy: context.session.subjectId,
            },
            {
              version: 1,
              published: true,
              createdBy: context.session.subjectId,
            },
          ]);
        }

        const version0Result = await client.getEntity({ id, version: 0 });
        expectResultValue(
          version0Result,
          copyEntity(expectedEntity, { info: { version: 0 }, fields: { title: 'Original' } })
        );

        const version1Result = await client.getEntity({ id, version: 1 });
        expectResultValue(version1Result, expectedEntity);

        const publishedResult = await publishedClient.getEntity({ id });
        expectResultValue(publishedResult, {
          id,
          info: {
            type: 'EntityAdminFoo',
            name: expectedEntity.info.name,
            authKey: 'none',
            createdAt,
          },
          fields: { ...emptyFooFields, title: 'Updated title' },
        });
      }
    }
  });

  test('Update EntityAdminFoo w/o publish', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'First', authKey: 'none' },
      fields: { title: 'First' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { createdAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: createResult.value.entity.info.name,
          version: 0,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: {
          ...emptyFooFields,
          title: 'First',
        },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, status: AdminEntityStatus.published, effect: 'published', updatedAt },
        ]);

        expectedEntity.info.status = AdminEntityStatus.published;
      }

      const updateResult = await client.updateEntity({
        id,
        info: { type: 'EntityAdminFoo', name: 'Updated name' },
        fields: { title: 'Updated title' },
      });
      if (expectOkResult(updateResult)) {
        const {
          entity: {
            info: { name },
          },
        } = updateResult.value;
        expect(name).toMatch(/^Updated name(#[0-9]+)?$/);

        expectedEntity.info.name = name;
        expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
        expectedEntity.info.status = AdminEntityStatus.modified;
        expectedEntity.info.version = 1;
        expectedEntity.fields.title = 'Updated title';

        expectResultValue(updateResult, { effect: 'updated', entity: expectedEntity });

        const historyResult = await client.getEntityHistory({ id });
        if (expectOkResult(historyResult)) {
          expectEntityHistoryVersions(historyResult.value, [
            {
              version: 0,
              published: true,
              createdBy: context.session.subjectId,
            },
            {
              version: 1,
              published: false,
              createdBy: context.session.subjectId,
            },
          ]);
        }

        const version0Result = await client.getEntity({ id, version: 0 });
        expectResultValue(
          version0Result,
          copyEntity(expectedEntity, { info: { version: 0 }, fields: { title: 'First' } })
        );

        const version1Result = await client.getEntity({ id, version: 1 });
        expectResultValue(version1Result, expectedEntity);

        const publishedResult = await publishedClient.getEntity({ id });
        expectResultValue(publishedResult, {
          id,
          info: { type: 'EntityAdminFoo', name, authKey: 'none', createdAt },
          fields: {
            ...emptyFooFields,
            title: 'First',
          },
        });
      }
    }
  });

  test('Update EntityAdminFoo w/o type and name', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Original', authKey: 'none' },
      fields: { title: 'Original' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { createdAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: createResult.value.entity.info.name,
          version: 1,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: {
          ...emptyFooFields,
          title: 'Updated title',
        },
      };

      const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });
      if (expectOkResult(updateResult)) {
        expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;

        expectResultValue(updateResult, { effect: 'updated', entity: expectedEntity });
      }

      const publishResult = await client.publishEntities([{ id, version: 1 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, status: AdminEntityStatus.published, effect: 'published', updatedAt },
        ]);

        expectedEntity.info.status = AdminEntityStatus.published;
        expectedEntity.info.updatedAt = updatedAt;
      }

      const historyResult = await client.getEntityHistory({ id });
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            published: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            published: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await client.getEntity({ id, version: 0 });
      expectResultValue(
        version0Result,
        copyEntity(expectedEntity, { info: { version: 0 }, fields: { title: 'Original' } })
      );

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(version1Result, expectedEntity);

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: expectedEntity.info.name,
          authKey: 'none',
          createdAt,
        },
        fields: { ...emptyFooFields, title: 'Updated title' },
      });
    }
  });

  test('Update EntityAdminFoo w/o providing all fields', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'First name', authKey: 'none' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { createdAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: createResult.value.entity.info.name,
          version: 0,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: {
          ...emptyFooFields,
          title: 'First title',
          summary: 'First summary',
        },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const updateResult = await client.updateEntity({
        id,
        fields: { summary: 'Updated summary' },
      });
      if (expectOkResult(updateResult)) {
        expectedEntity.info.version = 1;
        expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
        expectedEntity.fields.summary = 'Updated summary';
        expectResultValue(updateResult, { effect: 'updated', entity: expectedEntity });
      }

      const publishResult = await client.publishEntities([{ id, version: 1 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, status: AdminEntityStatus.published, effect: 'published', updatedAt },
        ]);

        expectedEntity.info.status = AdminEntityStatus.published;
        expectedEntity.info.updatedAt = updatedAt;
      }

      const historyResult = await client.getEntityHistory({ id });
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            published: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            published: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await client.getEntity({ id, version: 0 });
      expectResultValue(
        version0Result,
        copyEntity(expectedEntity, { info: { version: 0 }, fields: { summary: 'First summary' } })
      );

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(version1Result, expectedEntity);

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: expectedEntity.info.name,
          authKey: 'none',
          createdAt,
        },
        fields: {
          ...emptyFooFields,
          title: 'First title',
          summary: 'Updated summary',
        },
      });
    }
  });

  test('Update EntityAdminFoo with the same name', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'First name', authKey: 'none' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt },
        },
      } = createResult.value;

      const updateResult = await client.updateEntity({ id, info: { name }, fields: {} });
      expectResultValue(updateResult, { effect: 'none', entity: createResult.value.entity });

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, status: AdminEntityStatus.published, effect: 'published', updatedAt },
        ]);
      }

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: { type: 'EntityAdminFoo', name, authKey: 'none', createdAt },
        fields: { ...emptyFooFields, title: 'First title', summary: 'First summary' },
      });
    }
  });

  test('Update EntityAdminFoo normalizes empty string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Draft', authKey: 'none' },
      fields: { title: 'Hello' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const updateResult = await client.updateEntity({ id, fields: { title: '' } });
      if (expectOkResult(updateResult)) {
        const {
          entity: {
            fields: { title },
          },
        } = updateResult.value;

        expect(title).toBe(null);
      }
    }
  });

  test('Update EntityAdminFoo normalizes empty value item', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Draft', authKey: 'none' },
      fields: {},
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          version: 0,
          name: createResult.value.entity.info.name,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt: createResult.value.entity.info.createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: { ...emptyBazFields },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const updateResult = await client.updateEntity({
        id,
        fields: { twoStrings: { type: 'EntityAdminTwoStrings' } },
      });
      if (expectOkResult(updateResult)) {
        expectedEntity.info.version = 1;
        expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
        expectedEntity.fields.twoStrings = { type: 'EntityAdminTwoStrings', one: null, two: null };
      }
      expectResultValue(updateResult, { effect: 'updated', entity: expectedEntity });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Update EntityAdminFoo with reference', async () => {
    const createFooResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'First name', authKey: 'none' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    if (expectOkResult(createFooResult)) {
      const {
        entity: {
          id: fooId,
          info: { createdAt },
        },
      } = createFooResult.value;

      const expectedEntity: AdminEntity = {
        id: fooId,
        info: {
          type: 'EntityAdminFoo',
          name: createFooResult.value.entity.info.name,
          version: 0,
          authKey: 'none',
          status: AdminEntityStatus.draft,
          createdAt,
          updatedAt: createFooResult.value.entity.info.updatedAt,
        },
        fields: { ...emptyFooFields, title: 'First title', summary: 'First summary' },
      };

      expectResultValue(createFooResult, { effect: 'created', entity: expectedEntity });

      const createBarResult = await client.createEntity({
        info: { type: 'EntityAdminBar', name: 'Bar entity', authKey: 'none' },
        fields: { title: 'Bar entity' },
      });
      if (expectOkResult(createBarResult)) {
        const {
          entity: { id: barId },
        } = createBarResult.value;

        const updateResult = await client.updateEntity({
          id: fooId,
          fields: { bar: { id: barId } },
        });

        if (expectOkResult(updateResult)) {
          expectedEntity.info.version = 1;
          expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
          expectedEntity.fields.bar = { id: barId };
        }

        expectResultValue(updateResult, { effect: 'updated', entity: expectedEntity });

        const publishResult = await client.publishEntities([
          { id: fooId, version: 1 },
          { id: barId, version: 0 },
        ]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt: fooUpdatedAt }, { updatedAt: barUpdatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            {
              id: fooId,
              status: AdminEntityStatus.published,
              effect: 'published',
              updatedAt: fooUpdatedAt,
            },
            {
              id: barId,
              status: AdminEntityStatus.published,
              effect: 'published',
              updatedAt: barUpdatedAt,
            },
          ]);
          expectedEntity.info.status = AdminEntityStatus.published;
          expectedEntity.info.updatedAt = fooUpdatedAt;
        }

        const version0Result = await client.getEntity({ id: fooId, version: 0 });
        expectResultValue(
          version0Result,
          copyEntity(expectedEntity, { info: { version: 0 }, fields: { bar: null } })
        );

        const version1Result = await client.getEntity({ id: fooId, version: 1 });
        expectResultValue(version1Result, expectedEntity);

        const publishedResult = await publishedClient.getEntity({ id: fooId });
        expectResultValue(publishedResult, {
          id: fooId,
          info: {
            type: 'EntityAdminFoo',
            name: expectedEntity.info.name,
            authKey: 'none',
            createdAt,
          },
          fields: { title: 'First title', summary: 'First summary', bar: { id: barId } },
        });
      }
    }
  });

  test('Update EntityAdminFoo without changing a reference', async () => {
    const createBar1Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar 1 entity', authKey: 'none' },
      fields: { title: 'Bar 1 entity' },
    });
    const createBar2Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar 2 entity', authKey: 'none' },
      fields: { title: 'Bar 2 entity' },
    });
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const {
        entity: { id: bar1Id },
      } = createBar1Result.value;
      const {
        entity: { id: bar2Id },
      } = createBar2Result.value;

      const publishResult = await client.publishEntities([
        { id: bar1Id, version: 0 },
        { id: bar2Id, version: 0 },
      ]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt: updatedAt1 }, { updatedAt: updatedAt2 }] = publishResult.value;
        expectResultValue(publishResult, [
          {
            id: bar1Id,
            status: AdminEntityStatus.published,
            effect: 'published',
            updatedAt: updatedAt1,
          },
          {
            id: bar2Id,
            status: AdminEntityStatus.published,
            effect: 'published',
            updatedAt: updatedAt2,
          },
        ]);
      }

      const createBazResult = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'First name', authKey: 'none' },
        fields: {
          title: 'First title',
          bar: { id: bar1Id },
          bars: [{ id: bar1Id }, { id: bar2Id }],
        },
      });
      if (expectOkResult(createBazResult)) {
        const {
          entity: {
            id: bazId,
            info: { createdAt: bazCreatedAt },
          },
        } = createBazResult.value;

        const expectedEntity: AdminEntity = {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: createBazResult.value.entity.info.name,
            version: 0,
            authKey: 'none',
            status: AdminEntityStatus.draft,
            createdAt: createBazResult.value.entity.info.createdAt,
            updatedAt: createBazResult.value.entity.info.updatedAt,
          },
          fields: {
            ...emptyBazFields,
            title: 'First title',
            bar: { id: bar1Id },
            bars: [{ id: bar1Id }, { id: bar2Id }],
          },
        };

        expectResultValue(createBazResult, { effect: 'created', entity: expectedEntity });

        const updateResult = await client.updateEntity({
          id: bazId,
          fields: { title: 'Updated title' },
        });
        if (expectOkResult(updateResult)) {
          expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
          expectedEntity.info.version = 1;
          expectedEntity.fields.title = 'Updated title';
        }

        expectResultValue(updateResult, { effect: 'updated', entity: expectedEntity });

        const publishResult = await client.publishEntities([{ id: bazId, version: 1 }]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            { id: bazId, status: AdminEntityStatus.published, effect: 'published', updatedAt },
          ]);
          expectedEntity.info.status = AdminEntityStatus.published;
          expectedEntity.info.updatedAt = updatedAt;
        }

        const version0Result = await client.getEntity({ id: bazId, version: 0 });
        expectResultValue(
          version0Result,
          copyEntity(expectedEntity, { info: { version: 0 }, fields: { title: 'First title' } })
        );

        const version1Result = await client.getEntity({ id: bazId, version: 1 });
        expectResultValue(version1Result, expectedEntity);

        const publishedResult = await publishedClient.getEntity({ id: bazId });
        expectResultValue(publishedResult, {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: expectedEntity.info.name,
            authKey: 'none',
            createdAt: bazCreatedAt,
          },
          fields: {
            ...emptyBazFields,
            title: 'Updated title',
            bar: { id: bar1Id },
            bars: [{ id: bar1Id }, { id: bar2Id }],
          },
        });
      }
    }
  });

  test('Update archived EntityAdminFoo', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Original', authKey: 'none' },
      fields: { title: 'Original' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt },
        },
      } = createResult.value;

      const archiveResult = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          status: AdminEntityStatus.archived,
          effect: 'archived',
          updatedAt,
        });
      }

      const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });

      if (expectOkResult(updateResult)) {
        const {
          entity: {
            info: { updatedAt },
          },
        } = updateResult.value;
        expectResultValue(updateResult, {
          effect: 'updated',
          entity: {
            id,
            info: {
              type: 'EntityAdminFoo',
              name,
              version: 1,
              authKey: 'none',
              status: AdminEntityStatus.archived,
              createdAt,
              updatedAt,
            },
            fields: { ...emptyFooFields, title: 'Updated title' },
          },
        });
      }
    }
  });

  test('Update published with the same field does not create new version and returns correct publishing state', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo', authKey: 'none' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity,
        entity: { id },
      } = createResult.value;

      expectOkResult(await client.publishEntities([{ id, version: 0 }]));

      const updateResult = await client.updateEntity({ id, fields: { title: 'Foo title' } });
      if (expectOkResult(updateResult)) {
        const {
          entity: {
            info: { updatedAt },
          },
        } = updateResult.value;
        expectResultValue(updateResult, {
          effect: 'none',
          entity: copyEntity(entity, {
            info: { authKey: 'none', status: AdminEntityStatus.published, updatedAt },
          }),
        });
      }
    }
  });

  test('Error: Update EntityAdminFoo with reference to missing entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name', authKey: 'none' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;
      const updateResult = await client.updateEntity({
        id,
        fields: { bar: { id: '9783ca4f-f5b4-4f6a-a7bf-aae33e227841' } },
      });

      expectErrorResult(
        updateResult,
        ErrorType.BadRequest,
        'entity.fields.bar: Referenced entity (9783ca4f-f5b4-4f6a-a7bf-aae33e227841) doesn’t exist'
      );
    }
  });

  test('Error: Update EntityAdminFoo with reference to wrong entity type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name', authKey: 'none' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;
      const referenceId = entitiesOfTypeAdminOnlyEditBeforeNone[0].id;

      const updateResult = await client.updateEntity({ id, fields: { bar: { id: referenceId } } });
      expectErrorResult(
        updateResult,
        ErrorType.BadRequest,
        `entity.fields.bar: Referenced entity (${referenceId}) has an invalid type AdminOnlyEditBefore`
      );
    }
  });

  test('Error: Using wrong authKey', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name', authKey: 'subject' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const updateResult = await adminClientOther.updateEntity({
        id,
        fields: {},
      });
      expectErrorResult(updateResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
    }
  });
});

describe('upsertEntity()', () => {
  test('Update entity without any change and same name', async () => {
    // Create another entity to ensure we get a non-unique name
    expectOkResult(
      await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Non-unique name', authKey: 'none' },
        fields: { title: 'Original title' },
      })
    );

    const id = insecureTestUuidv4();
    const upsertEntity = {
      id,
      info: { type: 'EntityAdminBaz', name: 'Non-unique name', authKey: 'none' },
      fields: { title: 'Original title' },
    };

    const createResult = await client.upsertEntity(upsertEntity);
    if (expectOkResult(createResult)) {
      expect(createResult.value.effect).toBe('created');

      const updateResult = await client.upsertEntity(upsertEntity);
      expectResultValue(updateResult, {
        effect: 'none',
        entity: createResult.value.entity,
      });
    }
  });

  test('Error: Using authKey where adapter returns error', async () => {
    const result = await client.upsertEntity({
      id: insecureTestUuidv4(),
      info: {
        type: 'EntityAdminFoo',
        name: 'Foo',
        authKey: 'unauthorized',
      },
      fields: {},
    });

    expectErrorResult(
      result,
      ErrorType.NotAuthorized,
      'User not authorized to use authKey unauthorized'
    );
  });

  test('Error: Update Using wrong authKey', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name', authKey: 'subject' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const updateResult = await adminClientOther.upsertEntity({
        id,
        info: { type: 'EntityAdminFoo', name: 'Foo name', authKey: 'none' },
        fields: {},
      });
      expectErrorResult(updateResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
    }
  });
});

describe('publishEntities()', () => {
  test('Archived entity', async () => {
    const createBaz1Result = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1', authKey: 'none' },
      fields: { title: 'Baz title 1' },
    });
    if (expectOkResult(createBaz1Result)) {
      const {
        entity: {
          id,
          info: { name, version, createdAt },
        },
      } = createBaz1Result.value;

      const archiveResult = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          status: AdminEntityStatus.archived,
          effect: 'archived',
          updatedAt,
        });
      }

      const publishResult = await client.publishEntities([{ id, version }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, status: AdminEntityStatus.published, effect: 'published', updatedAt },
        ]);

        const getResult = await client.getEntity({ id });
        if (expectOkResult(getResult)) {
          const {
            info: { updatedAt },
          } = getResult.value;
          expectResultValue(getResult, {
            id,
            info: {
              type: 'EntityAdminBaz',
              name,
              version: 0,
              authKey: 'none',
              status: AdminEntityStatus.published,
              createdAt,
              updatedAt,
            },
            fields: { ...emptyBazFields, title: 'Baz title 1' },
          });
        }
      }
    }
  });

  test('Publish published version', async () => {
    const createBazResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1', authKey: 'none' },
      fields: { title: 'Baz title 1' },
    });
    if (expectOkResult(createBazResult)) {
      const {
        entity: { id: bazId },
      } = createBazResult.value;

      const firstPublishResult = await client.publishEntities([{ id: bazId, version: 0 }]);
      if (expectOkResult(firstPublishResult)) {
        const [{ updatedAt: firstPublishUpdatedAt }] = firstPublishResult.value;
        expectResultValue(firstPublishResult, [
          {
            id: bazId,
            status: AdminEntityStatus.published,
            effect: 'published',
            updatedAt: firstPublishUpdatedAt,
          },
        ]);

        const secondPublishResult = await client.publishEntities([{ id: bazId, version: 0 }]);
        expectResultValue(secondPublishResult, [
          {
            id: bazId,
            status: AdminEntityStatus.published,
            effect: 'none',
            updatedAt: firstPublishUpdatedAt,
          },
        ]);
      }
    }
  });

  test('Error: Reference to unpublished entity', async () => {
    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name', authKey: 'none' },
      fields: {
        title: 'Bar title',
      },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: { id: barId },
      } = createBarResult.value;

      const createFooResult = await client.createEntity({
        info: { type: 'EntityAdminFoo', name: 'Foo name', authKey: 'none' },
        fields: {
          title: 'Foo title',
          bar: { id: barId },
        },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: { id: fooId },
        } = createFooResult.value;

        const publishResult = await client.publishEntities([{ id: fooId, version: 0 }]);
        expectErrorResult(
          publishResult,
          ErrorType.BadRequest,
          `${fooId}: References unpublished entities: ${barId}`
        );
      }
    }
  });

  test('Error: adminOnly entity type', async () => {
    const createQuxResult = await client.createEntity({
      info: { type: 'EntityAdminQux', name: 'Qux name', authKey: 'none' },
      fields: {
        title: 'Qux title',
      },
    });
    if (expectOkResult(createQuxResult)) {
      const {
        entity: { id: quxId },
      } = createQuxResult.value;

      const publishResult = await client.publishEntities([{ id: quxId, version: 0 }]);
      expectErrorResult(publishResult, ErrorType.BadRequest, `Entity type is adminOnly: ${quxId}`);
    }
  });

  test('Error: missing value for required field in value item', async () => {
    const createBazResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz name', authKey: 'none' },
      fields: {
        oneString: { type: 'EntityAdminOneString', one: null },
      },
    });
    if (expectOkResult(createBazResult)) {
      const {
        entity: { id: bazId },
      } = createBazResult.value;

      const publishResult = await client.publishEntities([{ id: bazId, version: 0 }]);
      expectErrorResult(
        publishResult,
        ErrorType.BadRequest,
        `entity(${bazId}).fields.oneString.one: Required field is empty`
      );
    }
  });

  test('Error: missing value for required field in value item in rich text', async () => {
    const createBazResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz name', authKey: 'none' },
      fields: {
        body: createRichTextRootNode([
          createRichTextValueItemNode({ type: 'EntityAdminOneString', one: null }),
        ]),
      },
    });
    if (expectOkResult(createBazResult)) {
      const {
        entity: { id: bazId },
      } = createBazResult.value;

      const publishResult = await client.publishEntities([{ id: bazId, version: 0 }]);
      expectErrorResult(
        publishResult,
        ErrorType.BadRequest,
        `entity(${bazId}).fields.body[0].data.one: Required field is empty`
      );
    }
  });

  test('Error: Published unknown entity', async () => {
    const publishResult = await client.publishEntities([
      { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290', version: 0 },
    ]);
    expectErrorResult(
      publishResult,
      ErrorType.NotFound,
      'No such entities: b1bdcb61-e6aa-47ff-98d8-4cfe8197b290'
    );
  });

  test('Error: Published unknown version', async () => {
    const createFooResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name', authKey: 'none' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createFooResult)) {
      const {
        entity: { id: fooId },
      } = createFooResult.value;
      const publishResult = await client.publishEntities([{ id: fooId, version: 100 }]);
      expectErrorResult(publishResult, ErrorType.NotFound, `No such entities: ${fooId}`);
    }
  });
});

describe('unpublishEntities()', () => {
  test('Sets published state to withdrawn', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1', authKey: 'none' },
      fields: { title: 'Baz title 1' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, version, createdAt },
        },
      } = createResult.value;

      const publishResult = await client.publishEntities([{ id, version }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, status: AdminEntityStatus.published, effect: 'published', updatedAt },
        ]);
      }

      const unpublishResult = await client.unpublishEntities([{ id }]);
      if (expectOkResult(unpublishResult)) {
        const [{ updatedAt }] = unpublishResult.value;
        expectResultValue(unpublishResult, [
          { id, status: AdminEntityStatus.withdrawn, effect: 'unpublished', updatedAt },
        ]);

        const getResult = await client.getEntity({ id });
        if (expectOkResult(getResult)) {
          expectResultValue(getResult, {
            id,
            info: {
              type: 'EntityAdminBaz',
              name,
              version: 0,
              authKey: 'none',
              status: AdminEntityStatus.withdrawn,
              createdAt,
              updatedAt,
            },
            fields: { ...emptyBazFields, title: 'Baz title 1' },
          });
        }
      }
    }
  });

  test('Two published entities referencing each other', async () => {
    const createBaz1Result = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1', authKey: 'none' },
      fields: { title: 'Baz title 1' },
    });
    if (expectOkResult(createBaz1Result)) {
      const {
        entity: { id: baz1Id },
      } = createBaz1Result.value;

      const createBaz2Result = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz 2', authKey: 'none' },
        fields: { title: 'Baz title 2', baz: { id: baz1Id } },
      });
      if (expectOkResult(createBaz2Result)) {
        const {
          entity: { id: baz2Id },
        } = createBaz2Result.value;

        expectOkResult(await client.updateEntity({ id: baz1Id, fields: { baz: { id: baz2Id } } }));

        const publishResult = await client.publishEntities([
          { id: baz1Id, version: 1 },
          { id: baz2Id, version: 0 },
        ]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt: updatedAt1 }, { updatedAt: updatedAt2 }] = publishResult.value;
          expectResultValue(publishResult, [
            {
              id: baz1Id,
              status: AdminEntityStatus.published,
              effect: 'published',
              updatedAt: updatedAt1,
            },
            {
              id: baz2Id,
              status: AdminEntityStatus.published,
              effect: 'published',
              updatedAt: updatedAt2,
            },
          ]);
        }

        const unpublishResult = await client.unpublishEntities([{ id: baz1Id }, { id: baz2Id }]);
        if (expectOkResult(unpublishResult)) {
          const [{ updatedAt: updatedAt1 }, { updatedAt: updatedAt2 }] = unpublishResult.value;
          expectResultValue(unpublishResult, [
            {
              id: baz1Id,
              status: AdminEntityStatus.withdrawn,
              effect: 'unpublished',
              updatedAt: updatedAt1,
            },
            {
              id: baz2Id,
              status: AdminEntityStatus.withdrawn,
              effect: 'unpublished',
              updatedAt: updatedAt2,
            },
          ]);
        }
      }
    }
  });

  test('Unpublished entity referencing', async () => {
    const createBaz1Result = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1', authKey: 'none' },
      fields: {
        title: 'Baz title 1',
      },
    });
    if (expectOkResult(createBaz1Result)) {
      const {
        entity: { id: baz1Id },
      } = createBaz1Result.value;

      const createBaz2Result = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz 2', authKey: 'none' },
        fields: {
          title: 'Baz title 2',
          baz: { id: baz1Id },
        },
      });
      if (expectOkResult(createBaz2Result)) {
        const publishResult = await client.publishEntities([{ id: baz1Id, version: 0 }]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            { id: baz1Id, status: AdminEntityStatus.published, effect: 'published', updatedAt },
          ]);
        }

        const unpublishResult = await client.unpublishEntities([{ id: baz1Id }]);
        if (expectOkResult(unpublishResult)) {
          const [{ updatedAt }] = unpublishResult.value;
          expectResultValue(unpublishResult, [
            { id: baz1Id, status: AdminEntityStatus.withdrawn, effect: 'unpublished', updatedAt },
          ]);
        }
      }
    }
  });

  test('Unpublished entity', async () => {
    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name', authKey: 'none' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: {
          id,
          info: { updatedAt },
        },
      } = createBarResult.value;

      const publishResult = await client.unpublishEntities([{ id }]);
      expectResultValue(publishResult, [
        { id, status: AdminEntityStatus.draft, effect: 'none', updatedAt },
      ]);
    }
  });

  test('Unpublish archived entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1', authKey: 'none' },
      fields: { title: 'Baz title 1' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const archiveResult = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          status: AdminEntityStatus.archived,
          effect: 'archived',
          updatedAt,
        });

        const unpublishResult = await client.unpublishEntities([{ id }]);
        expectResultValue(unpublishResult, [
          {
            id,
            status: AdminEntityStatus.archived,
            effect: 'none',
            updatedAt,
          },
        ]);
      }
    }
  });

  test('Error: Reference from published entity', async () => {
    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name', authKey: 'none' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: { id: barId },
      } = createBarResult.value;

      const createFooResult = await client.createEntity({
        info: { type: 'EntityAdminFoo', name: 'Foo name', authKey: 'none' },
        fields: {
          title: 'Foo title',
          bar: { id: barId },
        },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: { id: fooId },
        } = createFooResult.value;

        const publishResult = await client.publishEntities([
          { id: fooId, version: 0 },
          { id: barId, version: 0 },
        ]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt: fooUpdatedAt }, { updatedAt: barUpdatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            {
              id: fooId,
              status: AdminEntityStatus.published,
              effect: 'published',
              updatedAt: fooUpdatedAt,
            },
            {
              id: barId,
              status: AdminEntityStatus.published,
              effect: 'published',
              updatedAt: barUpdatedAt,
            },
          ]);
        }

        const unpublishResult = await client.unpublishEntities([{ id: barId }]);
        expectErrorResult(
          unpublishResult,
          ErrorType.BadRequest,
          `${barId}: Published entities referencing entity: ${fooId}`
        );
      }
    }
  });
});

describe('archiveEntity()', () => {
  test('Archive new entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name', authKey: 'none' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt },
        },
      } = createResult.value;

      const archiveResult = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          status: AdminEntityStatus.archived,
          effect: 'archived',
          updatedAt,
        });

        const historyResult = await client.getPublishingHistory({ id });
        if (expectOkResult(historyResult)) {
          const { publishedAt } = historyResult.value.events[0];
          expectResultValue(historyResult, {
            id,
            events: [
              {
                kind: PublishingEventKind.archive,
                publishedAt,
                publishedBy: context.session.subjectId,
                version: null,
              },
            ],
          });
        }

        const getResult = await client.getEntity({ id });
        if (expectOkResult(getResult)) {
          expectResultValue(getResult, {
            id,
            info: {
              name,
              type: 'EntityAdminBar',
              version: 0,
              authKey: 'none',
              status: AdminEntityStatus.archived,
              createdAt,
              updatedAt,
            },
            fields: { title: 'Bar title' },
          });
        }
      }
    }
  });

  test('Archive archived entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name', authKey: 'none' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const archiveResult1 = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult1)) {
        const { updatedAt: firstArchiveUpdatedAt } = archiveResult1.value;
        expectResultValue(archiveResult1, {
          id,
          status: AdminEntityStatus.archived,
          effect: 'archived',
          updatedAt: firstArchiveUpdatedAt,
        });

        const archiveResult2 = await client.archiveEntity({ id });
        if (expectOkResult(archiveResult2)) {
          expectResultValue(archiveResult2, {
            id,
            status: AdminEntityStatus.archived,
            effect: 'none',
            updatedAt: firstArchiveUpdatedAt,
          });
        }
      }

      const historyResult = await client.getPublishingHistory({ id });
      if (expectOkResult(historyResult)) {
        expect(historyResult.value.events).toHaveLength(1); // no event created by second archive
      }
    }
  });
});

describe('unarchiveEntity()', () => {
  test('Unarchive new entity (does nothing)', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name', authKey: 'none' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { updatedAt },
        },
      } = createResult.value;

      const unarchiveResult = await client.unarchiveEntity({ id });
      if (expectOkResult(unarchiveResult)) {
        expectResultValue(unarchiveResult, {
          id,
          status: AdminEntityStatus.draft,
          effect: 'none',
          updatedAt,
        });
      }

      const historyResult = await client.getPublishingHistory({ id });
      expectResultValue(historyResult, { id, events: [] });
    }
  });

  test('Unarchive archived entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name', authKey: 'none' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt },
        },
      } = createResult.value;

      const archiveResult = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          status: AdminEntityStatus.archived,
          effect: 'archived',
          updatedAt,
        });
      }

      const unarchiveResult = await client.unarchiveEntity({ id });
      if (expectOkResult(unarchiveResult)) {
        const { updatedAt } = unarchiveResult.value;
        expectResultValue(unarchiveResult, {
          id,
          status: AdminEntityStatus.draft,
          effect: 'unarchived',
          updatedAt,
        });

        const historyResult = await client.getPublishingHistory({ id });
        if (expectOkResult(historyResult)) {
          const { publishedAt: publishedAt0 } = historyResult.value.events[0];
          const { publishedAt: publishedAt1 } = historyResult.value.events[1];
          expectResultValue(historyResult, {
            id,
            events: [
              {
                kind: PublishingEventKind.archive,
                publishedAt: publishedAt0,
                publishedBy: context.session.subjectId,
                version: null,
              },
              {
                kind: PublishingEventKind.unarchive,
                publishedAt: publishedAt1,
                publishedBy: context.session.subjectId,
                version: null,
              },
            ],
          });
        }

        const getResult = await client.getEntity({ id });
        if (expectOkResult(getResult)) {
          expectResultValue(getResult, {
            id,
            info: {
              name,
              type: 'EntityAdminBar',
              version: 0,
              authKey: 'none',
              status: AdminEntityStatus.draft,
              createdAt,
              updatedAt,
            },
            fields: { title: 'Bar title' },
          });
        }
      }
    }
  });

  test('Unarchive once published, then archived entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name', authKey: 'none' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { version },
        },
      } = createResult.value;

      const publishResult = await client.publishEntities([{ id, version }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, status: AdminEntityStatus.published, effect: 'published', updatedAt },
        ]);
      }

      const unpublishResult = await client.unpublishEntities([{ id }]);
      if (expectOkResult(unpublishResult)) {
        const [{ updatedAt }] = unpublishResult.value;
        expectResultValue(unpublishResult, [
          { id, status: AdminEntityStatus.withdrawn, effect: 'unpublished', updatedAt },
        ]);
      }

      const archiveResult = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          status: AdminEntityStatus.archived,
          effect: 'archived',
          updatedAt,
        });
      }

      const unarchiveResult = await client.unarchiveEntity({ id });
      if (expectOkResult(unarchiveResult)) {
        const { updatedAt } = unarchiveResult.value;
        expectResultValue(unarchiveResult, {
          id,
          status: AdminEntityStatus.withdrawn,
          effect: 'unarchived',
          updatedAt,
        });
      }
    }
  });
});

describe('getPublishingHistory()', () => {
  test('New unpublished entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Unpublished', authKey: 'none' },
      fields: {},
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;
      const historyResult = await client.getPublishingHistory({ id });
      expectResultValue(historyResult, { id, events: [] });
    }
  });

  test('One published version', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Published', authKey: 'none' },
      fields: {},
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, status: AdminEntityStatus.published, effect: 'published', updatedAt },
        ]);
      }

      const historyResult = await client.getPublishingHistory({ id });
      if (expectOkResult(historyResult)) {
        const { publishedAt } = historyResult.value.events[0];
        expectResultValue(historyResult, {
          id,
          events: [
            {
              kind: PublishingEventKind.publish,
              publishedAt,
              publishedBy: context.session.subjectId,
              version: 0,
            },
          ],
        });
      }
    }
  });

  test('One unpublished version', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Published/Unpublished', authKey: 'none' },
      fields: {},
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, status: AdminEntityStatus.published, effect: 'published', updatedAt },
        ]);
      }

      const unpublishResult = await client.unpublishEntities([{ id }]);
      if (expectOkResult(unpublishResult)) {
        const [{ updatedAt }] = unpublishResult.value;
        expectResultValue(unpublishResult, [
          { id, status: AdminEntityStatus.withdrawn, effect: 'unpublished', updatedAt },
        ]);
      }

      const historyResult = await client.getPublishingHistory({ id });
      if (expectOkResult(historyResult)) {
        const publishedAt0 = historyResult.value.events[0]?.publishedAt;
        const publishedAt1 = historyResult.value.events[1]?.publishedAt;
        expectResultValue(historyResult, {
          id,
          events: [
            {
              kind: PublishingEventKind.publish,
              publishedAt: publishedAt0,
              publishedBy: context.session.subjectId,
              version: 0,
            },
            {
              kind: PublishingEventKind.unpublish,
              publishedAt: publishedAt1,
              publishedBy: context.session.subjectId,
              version: null,
            },
          ],
        });
      }
    }
  });
});
