import {
  assertOkResult,
  copyEntity,
  createRichText,
  createRichTextComponentNode,
  createRichTextParagraphNode,
  createRichTextTextNode,
  EntityStatus,
  ErrorType,
  FieldType,
  isEntityNameAsRequested,
  type DossierClient,
  type Entity,
  type PublishedDossierClient,
} from '@dossierhq/core';
import { expectErrorResult, expectOkResult, expectResultValue } from '@dossierhq/core-vitest';
import type { Server, SessionContext } from '@dossierhq/server';
import { validate as validateUuid } from 'uuid';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  createPostgresTestServerAndClient,
  expectSearchResultEntities,
  randomUUID,
  safelyUpdateSchemaSpecification,
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
let client: DossierClient;
let clientOther: DossierClient;
let publishedClient: PublishedDossierClient;
let entitiesOfTypeAdminOnlyEditBeforeNone: Entity[];

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
  component: null,
};

beforeAll(async () => {
  const result = await createPostgresTestServerAndClient();
  if (result.isError()) throw result.toError();
  server = result.value.server;
  context = result.value.context;
  client = server.createDossierClient(context);

  const sessionOtherResult = server.createSession({
    provider: 'test',
    identifier: 'other',
    defaultAuthKeys: [''],
  });
  clientOther = server.createDossierClient(() => sessionOtherResult);

  publishedClient = server.createPublishedDossierClient(context);

  const schemaUpdateResult = await safelyUpdateSchemaSpecification(client, {
    entityTypes: [
      {
        name: 'EntityAdminFoo',
        nameField: 'title',
        authKeyPattern: 'anyAuthKey',
        fields: [
          { name: 'title', type: FieldType.String, required: true },
          { name: 'summary', type: FieldType.String },
          {
            name: 'bar',
            type: FieldType.Reference,
            entityTypes: ['EntityAdminBar'],
          },
        ],
      },
      {
        name: 'EntityAdminBar',
        fields: [{ name: 'title', type: FieldType.String }],
      },
      {
        name: 'EntityAdminBaz',
        fields: [
          { name: 'title', type: FieldType.String },
          {
            name: 'bar',
            type: FieldType.Reference,
            entityTypes: ['EntityAdminBar'],
          },
          {
            name: 'baz',
            type: FieldType.Reference,
            entityTypes: ['EntityAdminBaz'],
          },
          { name: 'tags', type: FieldType.String, list: true },
          { name: 'active', type: FieldType.Boolean },
          { name: 'activeList', type: FieldType.Boolean, list: true },
          { name: 'body', type: FieldType.RichText },
          { name: 'bodyList', type: FieldType.RichText, list: true },
          { name: 'location', type: FieldType.Location },
          { name: 'locations', type: FieldType.Location, list: true },
          {
            name: 'bars',
            type: FieldType.Reference,
            list: true,
            entityTypes: ['EntityAdminBar'],
          },
          {
            name: 'oneString',
            type: FieldType.Component,
            componentTypes: ['EntityAdminOneString'],
          },
          {
            name: 'twoStrings',
            type: FieldType.Component,
            componentTypes: ['EntityAdminTwoStrings'],
          },
          {
            name: 'twoStringsList',
            type: FieldType.Component,
            componentTypes: ['EntityAdminTwoStrings'],
            list: true,
          },
          {
            name: 'booleanString',
            type: FieldType.Component,
            componentTypes: ['EntityAdminBooleanString'],
          },
          {
            name: 'stringReference',
            type: FieldType.Component,
            componentTypes: ['EntityAdminStringReference'],
          },
          {
            name: 'listFields',
            type: FieldType.Component,
            componentTypes: ['EntityAdminListFields'],
          },
          {
            name: 'listFieldsList',
            type: FieldType.Component,
            list: true,
            componentTypes: ['EntityAdminListFields'],
          },
          {
            name: 'nested',
            type: FieldType.Component,
            componentTypes: ['EntityAdminNested'],
          },
          {
            name: 'component',
            type: FieldType.Component,
          },
        ],
      },
      {
        name: 'EntityAdminQux',
        publishable: false,
        fields: [{ name: 'title', type: FieldType.String }],
      },
      {
        name: 'AdminOnlyEditBefore',
        fields: [{ name: 'message', type: FieldType.String }],
      },
    ],
    componentTypes: [
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
          {
            name: 'reference',
            type: FieldType.Reference,
            entityTypes: ['EntityAdminBar'],
          },
        ],
      },
      {
        name: 'EntityAdminListFields',
        fields: [
          { name: 'stringList', type: FieldType.String, list: true },
          {
            name: 'referenceList',
            type: FieldType.Reference,
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
            type: FieldType.Component,
            componentTypes: ['EntityAdminNested'],
          },
        ],
      },
      {
        name: 'EntityAdminOneStringAdminOnly',
        adminOnly: true,
        fields: [{ name: 'one', type: FieldType.String, required: true }],
      },
    ],
    patterns: [{ name: 'anyAuthKey', pattern: '.*' }],
  });
  schemaUpdateResult.throwIfError();

  await ensureEntitiesExistForAdminOnlyEditBefore(client, '');
  entitiesOfTypeAdminOnlyEditBeforeNone = await getEntitiesForAdminOnlyEditBefore(client, '');
}, 100_000);
afterAll(async () => {
  await server.shutdown();
});

async function ensureEntitiesExistForAdminOnlyEditBefore(client: DossierClient, authKey: string) {
  (
    await ensureEntityCount(client, 50, 'AdminOnlyEditBefore', authKey, (random) => ({
      message: `Hey ${random}`,
    }))
  ).throwIfError();

  for (const status of [
    EntityStatus.draft,
    EntityStatus.published,
    EntityStatus.modified,
    EntityStatus.withdrawn,
    EntityStatus.archived,
  ]) {
    (
      await ensureEntityWithStatus(client, 'AdminOnlyEditBefore', authKey, status, (random) => ({
        message: `Hey ${random}`,
      }))
    ).throwIfError();
  }
}

async function getEntitiesForAdminOnlyEditBefore(client: DossierClient, authKey: string) {
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
  bazReferencesPerEntity = 1,
) {
  const createBarResult = await client.createEntity({
    info: { type: 'EntityAdminBar', name: 'Bar' },
    fields: { title: 'Bar' },
  });
  if (createBarResult.isError()) {
    throw createBarResult.toError();
  }

  const {
    entity: { id: barId },
  } = createBarResult.value;

  const fooEntities: Entity[] = [];
  const bazEntities: Entity[] = [];

  for (let i = 0; i < fooCount; i += 1) {
    const createFooResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo: ' + i },
      fields: { bar: { id: barId } },
    });
    if (expectOkResult(createFooResult)) {
      fooEntities.push(createFooResult.value.entity);
    }
  }
  for (let i = 0; i < bazCount; i += 1) {
    const bars = [...new Array<undefined>(bazReferencesPerEntity - 1)].map(() => ({ id: barId }));
    const createBazResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz: ' + i },
      fields: { bar: { id: barId }, bars: bars.length > 0 ? bars : null },
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
      info: { type: 'EntityAdminFoo', name: 'Foo' },
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

      const expectedEntity: Entity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt,
          updatedAt,
        },
        fields: { ...emptyFooFields, title: 'Title' },
      };

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const publishResult = await client.publishEntities([{ id, version: 1 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          {
            id,
            status: EntityStatus.published,
            effect: 'published',
            updatedAt,
          },
        ]);

        expectedEntity.info.status = EntityStatus.published;
        expectedEntity.info.updatedAt = updatedAt;
        expectedEntity.info.validPublished = true;
      }

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(
        version1Result,
        copyEntity(expectedEntity, { info: { updatedAt: createdAt } }),
      );

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          authKey: '',
          createdAt,
          valid: true,
        },
        fields: { ...emptyFooFields, title: 'Title' },
      });
    }
  });

  test('Create EntityAdminFoo w/o publish', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Draft' },
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
            version: 1,
            authKey: '',
            status: EntityStatus.draft,
            valid: true,
            validPublished: null,
            createdAt,
            updatedAt,
          },
          fields: { ...emptyFooFields, title: 'Draft' },
        },
      });

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(version1Result, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
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
    const id = randomUUID();
    const createResult = await client.createEntity({
      id,
      info: { type: 'EntityAdminFoo', name: 'Draft' },
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
            version: 1,
            authKey: '',
            status: EntityStatus.draft,
            valid: true,
            validPublished: null,
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
      info: { type: 'EntityAdminFoo', name: 'Draft' },
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

  test('Create EntityAdminFoo normalizes empty component', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Draft' },
      fields: { twoStrings: { type: 'EntityAdminTwoStrings' } },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: Entity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          version: 1,
          name,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
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
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: { id: barId },
      } = createBarResult.value;

      const createFooResult = await client.createEntity({
        info: { type: 'EntityAdminFoo', name: 'Foo name' },
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

        const expectedFooEntity: Entity = {
          id: fooId,
          info: {
            type: 'EntityAdminFoo',
            name,
            version: 1,
            authKey: '',
            status: EntityStatus.draft,
            valid: true,
            validPublished: null,
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
          { id: fooId, version: 1 },
          { id: barId, version: 1 },
        ]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt: fooUpdatedAt }, { updatedAt: barUpdatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            {
              id: fooId,
              status: EntityStatus.published,
              effect: 'published',
              updatedAt: fooUpdatedAt,
            },
            {
              id: barId,
              status: EntityStatus.published,
              effect: 'published',
              updatedAt: barUpdatedAt,
            },
          ]);

          expectedFooEntity.info.status = EntityStatus.published;
          expectedFooEntity.info.updatedAt = fooUpdatedAt;
          expectedFooEntity.info.validPublished = true;
        }

        const fooVersion1Result = await client.getEntity({
          id: fooId,
          version: 1,
        });
        expectResultValue(
          fooVersion1Result,
          copyEntity(expectedFooEntity, { info: { updatedAt: createdAt } }),
        );

        const publishedFooResult = await publishedClient.getEntity({
          id: fooId,
        });
        expectResultValue(publishedFooResult, {
          id: fooId,
          info: {
            type: 'EntityAdminFoo',
            name,
            authKey: '',
            valid: true,
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
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: { tags: ['one', 'two', 'three'] },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: Entity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
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
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: { active: true, activeList: [true, false, true] },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: Entity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          active: true,
          activeList: [true, false, true],
        },
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
      info: { type: 'EntityAdminBaz', name: 'Baz' },
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

      const expectedEntity: Entity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
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

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with reference list', async () => {
    const createBar1Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar1' },
      fields: {},
    });
    const createBar2Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar2' },
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
        info: { type: 'EntityAdminBaz', name: 'Baz' },
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

        const expectedEntity: Entity = {
          id,
          info: {
            type: 'EntityAdminBaz',
            name: name,
            version: 1,
            authKey: '',
            status: EntityStatus.draft,
            valid: true,
            validPublished: null,
            createdAt,
            updatedAt,
          },
          fields: { ...emptyBazFields, bars: [{ id: bar1Id }, { id: bar2Id }] },
        };

        expectResultValue(createBazResult, {
          effect: 'created',
          entity: expectedEntity,
        });

        const getResult = await client.getEntity({ id });
        expectResultValue(getResult, expectedEntity);

        const referencesTo1 = await client.getEntities({
          linksTo: { id: bar1Id },
        });
        expectSearchResultEntities(referencesTo1, [baz]);

        const referencesTo2 = await client.getEntities({
          linksTo: { id: bar2Id },
        });
        expectSearchResultEntities(referencesTo2, [baz]);
      }
    }
  });

  test('Create EntityAdminBaz with EntityAdminTwoStrings component type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        twoStrings: {
          type: 'EntityAdminTwoStrings',
          one: 'First',
          two: 'Second',
        },
      },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: Entity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          twoStrings: {
            type: 'EntityAdminTwoStrings',
            one: 'First',
            two: 'Second',
          },
        },
      };

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with list of EntityAdminTwoStrings component type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
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

      const expectedEntity: Entity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
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

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with EntityAdminBooleanString component type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        booleanString: {
          type: 'EntityAdminBooleanString',
          boolean: true,
          string: 'String',
        },
      },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: Entity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          booleanString: {
            type: 'EntityAdminBooleanString',
            boolean: true,
            string: 'String',
          },
        },
      };

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with EntityAdminStringReference component type', async () => {
    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar' },
      fields: {},
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: { id: barId },
      } = createBarResult.value;

      const createBazResult = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz' },
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

        const expectedEntity: Entity = {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: bazName,
            version: 1,
            authKey: '',
            status: EntityStatus.draft,
            valid: true,
            validPublished: null,
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

        expectResultValue(createBazResult, {
          effect: 'created',
          entity: expectedEntity,
        });

        const getResult = await client.getEntity({ id: bazId });
        expectResultValue(getResult, expectedEntity);

        const barReferences = await client.getEntities({
          linksTo: { id: barId },
        });
        expectSearchResultEntities(barReferences, [baz]);
      }
    }
  });

  test('Create EntityAdminBaz with EntityAdminListFields component type', async () => {
    const createBar1Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar 1' },
      fields: {},
    });
    const createBar2Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar 2' },
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
        info: { type: 'EntityAdminBaz', name: 'Baz' },
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

        const expectedEntity: Entity = {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: bazName,
            version: 1,
            authKey: '',
            status: EntityStatus.draft,
            valid: true,
            validPublished: null,
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

        expectResultValue(createBazResult, {
          effect: 'created',
          entity: expectedEntity,
        });

        const getResult = await client.getEntity({ id: bazId });
        expectResultValue(getResult, expectedEntity);

        const bar1References = await client.getEntities({
          linksTo: { id: bar1Id },
        });

        expect(
          bar1References.isOk() &&
            bar1References.value?.edges.map((x) => (x.node.isOk() ? x.node.value.id : null)),
        ).toEqual([bazId]);

        const bar2References = await client.getEntities({
          linksTo: { id: bar2Id },
        });

        expect(
          bar2References.isOk() &&
            bar2References.value?.edges.map((x) => (x.node.isOk() ? x.node.value.id : null)),
        ).toEqual([bazId]);
      }
    }
  });

  test('Create EntityAdminBaz with EntityAdminNested component type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
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

      const expectedEntity: Entity = {
        id: bazId,
        info: {
          type: 'EntityAdminBaz',
          name: bazName,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
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

  test('Error: Create with invalid version', async () => {
    const result = await client.createEntity({
      info: {
        type: 'EntityAdminFoo',
        name: 'Foo',
        version: 0 as 1,
      },
      fields: {},
    });

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.info.version: Version must be 1 when creating a new entity',
    );
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
      'User not authorized to use authKey unauthorized',
    );
  });

  test('Error: Create with invalid field', async () => {
    const result = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo' },
      fields: { invalid: 'hello' },
    });

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.fields: Invalid fields for entity of type EntityAdminFoo: invalid',
    );
  });

  test('Error: Create EntityAdminFoo with reference to missing entity', async () => {
    const result = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name' },
      fields: {
        title: 'Foo title',
        bar: { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
      },
    });
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.fields.bar: Referenced entity (fcc46a9e-2097-4bd6-bb08-56d5f59db26b) doesn’t exist',
    );
  });

  test('Error: Create EntityAdminFoo with reference to wrong entity type', async () => {
    const referenceId = entitiesOfTypeAdminOnlyEditBeforeNone[0].id;
    const result = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name' },
      fields: {
        title: 'Foo title',
        bar: { id: referenceId },
      },
    });
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      `entity.fields.bar: Referenced entity (${referenceId}) has an invalid type AdminOnlyEditBefore`,
    );
  });

  test('Error: Set string when expecting list of string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        tags: 'invalid',
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.tags: Expected a list of String, got string',
    );
  });

  test('Error: Set list of string when expecting string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        title: ['invalid', 'foo'],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.title: Expected single String, got a list',
    );
  });

  test('Error: Set reference when expecting list of references', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        bars: { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.bars: Expected a list of Reference, got object',
    );
  });

  test('Error: Set list of references when expecting reference', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
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
      'entity.fields.bar: Expected single Reference, got a list',
    );
  });

  test('Error: component type missing type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        twoStrings: { one: 'One', two: 'Two' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.twoStrings.type: Missing a Component type',
    );
  });

  test('Error: component type with invalid type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        twoStrings: { type: 'Invalid' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.twoStrings: Couldn’t find spec for component type Invalid',
    );
  });

  test('Error: component type with wrong type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        oneString: { type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.oneString: Component of type EntityAdminTwoStrings is not allowed in field (supported types: EntityAdminOneString)',
    );
  });

  test('Error: component type with invalid field', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        oneString: {
          type: 'EntityAdminOneString',
          one: 'One',
          invalid: 'value',
        },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.oneString: Invalid fields for component of type EntityAdminOneString: invalid',
    );
  });

  test('Error: rich text single, where list is expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        bodyList: createRichText([]),
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.bodyList: Expected a list of RichText, got object',
    );
  });

  test('Error: rich text list, where single is expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: [createRichText([])],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.body: Expected single RichText, got a list',
    );
  });

  test('Error: rich text, forgotten root', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: createRichTextParagraphNode([createRichTextTextNode('')]),
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.body: RichText object is missing root',
    );
  });

  test('Error: rich text with string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: 'Hello',
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.body: Expected a RichText object, got string',
    );
  });

  test('Error: rich text without root', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: {},
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.body: RichText object is missing root',
    );
  });

  test('Error: rich text, root as string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: { root: 'Hello' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.body.root: Expected a RichText node, got string',
    );
  });

  test('Error: single location when list expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        locations: { lat: 55.60498, lng: 13.003822 },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.locations: Expected a list of Location, got object',
    );
  });

  test('Error: location list when single item expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        location: [{ lat: 55.60498, lng: 13.003822 }],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.location: Expected single Location, got a list',
    );
  });

  test('Error: location with empty object', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        location: {},
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.location: Expected {lat: number, lng: number}, got {lat: undefined, lng: undefined}',
    );
  });

  test('Error: single component type when list expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        twoStringsList: {
          type: 'EntityAdminTwoStrings',
          one: 'One',
          two: 'Two',
        },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.twoStringsList: Expected a list of Component, got object',
    );
  });

  test('Error: list of component type when single item expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
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
      'entity.fields.twoStrings: Expected single Component, got a list',
    );
  });
});

describe('getEntities() linksTo', () => {
  test('Query based on linksTo and entityTypes, one reference', async () => {
    const { barId, bazEntities } = await createBarWithFooBazReferences(1, 1);
    const [bazEntity] = bazEntities;

    const searchResult = await client.getEntities({
      entityTypes: ['EntityAdminBaz'],
      linksTo: { id: barId },
    });
    expectSearchResultEntities(searchResult, [bazEntity]);
  });
});

describe('getEntities() boundingBox', () => {
  test('Query based on bounding box for rich text', async () => {
    const boundingBox = randomBoundingBox();
    const center = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
    };

    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: createRichText([
          createRichTextComponentNode({
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

describe('getEntitiesTotalCount', () => {
  test('Query based on linksTo and entityTypes, one reference', async () => {
    const { barId } = await createBarWithFooBazReferences(1, 1);

    const result = await client.getEntitiesTotalCount({
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
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: { locations: [center, inside] },
    });

    if (expectOkResult(createResult)) {
      const searchResult = await client.getEntities({ boundingBox });

      const totalResult = await client.getEntitiesTotalCount({ boundingBox });
      if (expectOkResult(searchResult) && expectOkResult(totalResult)) {
        // Hopefully there aren't too many entities in the bounding box
        expect(searchResult.value?.pageInfo.hasNextPage).toBeFalsy();

        expect(totalResult.value).toBe(searchResult.value?.edges.length);
      }
    }
  });

  test('Query based on text', async () => {
    const resultBefore = await client.getEntitiesTotalCount({
      text: 'sensational clown',
    });
    if (expectOkResult(resultBefore)) {
      expectOkResult(
        await client.createEntity({
          info: { type: 'EntityAdminFoo', name: 'foo' },
          fields: { summary: 'That was indeed a sensational clown' },
        }),
      );

      const resultAfter = await client.getEntitiesTotalCount({
        text: 'sensational clown',
      });
      if (expectOkResult(resultAfter)) {
        expect(resultAfter.value).toBe(resultBefore.value + 1);
      }
    }
  });
});

describe('updateEntity()', () => {
  test('Update EntityAdminFoo and publish', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Original' },
      fields: { title: 'Original' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { createdAt, name: originalName },
        },
      } = createResult.value;

      const expectedEntity: Entity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: originalName,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: {
          ...emptyFooFields,
          title: 'Original',
        },
      };

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const updateResult = await client.updateEntity({
        id,
        info: { type: 'EntityAdminFoo', name: 'Updated name' },
        fields: { title: 'Updated title' },
      });
      assertOkResult(updateResult);
      const {
        entity: {
          info: { name },
        },
      } = updateResult.value;
      expect(name).toMatch(/^Updated name(#[0-9]+)?$/);

      expectedEntity.info.name = name;
      expectedEntity.info.version = 2;
      expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
      expectedEntity.fields.title = 'Updated title';

      expectResultValue(updateResult, {
        effect: 'updated',
        entity: expectedEntity,
      });

      const publishResult = await client.publishEntities([{ id, version: 2 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          {
            id,
            status: EntityStatus.published,
            effect: 'published',
            updatedAt,
          },
        ]);

        expectedEntity.info.status = EntityStatus.published;
        expectedEntity.info.updatedAt = updatedAt;
        expectedEntity.info.validPublished = true;
      }

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(
        version1Result,
        copyEntity(expectedEntity, {
          info: { version: 1, name: originalName, updatedAt: createdAt },
          fields: { title: 'Original' },
        }),
      );

      const version2Result = await client.getEntity({ id, version: 2 });
      expectResultValue(
        version2Result,
        copyEntity(expectedEntity, {
          info: { updatedAt: updateResult.value.entity.info.updatedAt },
        }),
      );

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: expectedEntity.info.name,
          authKey: '',
          createdAt,
          valid: true,
        },
        fields: { ...emptyFooFields, title: 'Updated title' },
      });
    }
  });

  test('Update EntityAdminFoo w/o publish', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'First' },
      fields: { title: 'First' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { createdAt, name: firstName },
        },
      } = createResult.value;

      const expectedEntity: Entity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: firstName,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: {
          ...emptyFooFields,
          title: 'First',
        },
      };

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const publishResult = await client.publishEntities([{ id, version: 1 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          {
            id,
            status: EntityStatus.published,
            effect: 'published',
            updatedAt,
          },
        ]);

        expectedEntity.info.status = EntityStatus.published;
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
        expectedEntity.info.status = EntityStatus.modified;
        expectedEntity.info.version = 2;
        expectedEntity.info.validPublished = true;
        expectedEntity.fields.title = 'Updated title';

        expectResultValue(updateResult, {
          effect: 'updated',
          entity: expectedEntity,
        });

        const version1Result = await client.getEntity({ id, version: 1 });
        expectResultValue(
          version1Result,
          copyEntity(expectedEntity, {
            info: { name: firstName, version: 1, updatedAt: createdAt },
            fields: { title: 'First' },
          }),
        );

        const version2Result = await client.getEntity({ id, version: 2 });
        expectResultValue(version2Result, expectedEntity);

        const publishedResult = await publishedClient.getEntity({ id });
        const publishedName = publishedResult.valueOrThrow().info.name;
        expect(isEntityNameAsRequested(publishedName, 'First')).toBeTruthy();
        expectResultValue(publishedResult, {
          id,
          info: {
            type: 'EntityAdminFoo',
            name: publishedName,
            authKey: '',
            createdAt,
            valid: true,
          },
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
      info: { type: 'EntityAdminFoo', name: 'Original' },
      fields: { title: 'Original' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { createdAt },
        },
      } = createResult.value;

      const expectedEntity: Entity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: createResult.value.entity.info.name,
          version: 2,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: {
          ...emptyFooFields,
          title: 'Updated title',
        },
      };

      const updateResult = await client.updateEntity({
        id,
        fields: { title: 'Updated title' },
      });
      assertOkResult(updateResult);
      expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
      expectResultValue(updateResult, {
        effect: 'updated',
        entity: expectedEntity,
      });

      const publishResult = await client.publishEntities([{ id, version: 2 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          {
            id,
            status: EntityStatus.published,
            effect: 'published',
            updatedAt,
          },
        ]);

        expectedEntity.info.status = EntityStatus.published;
        expectedEntity.info.updatedAt = updatedAt;
        expectedEntity.info.validPublished = true;
      }

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(
        version1Result,
        copyEntity(expectedEntity, {
          info: { version: 1, updatedAt: createdAt },
          fields: { title: 'Original' },
        }),
      );

      const version2Result = await client.getEntity({ id, version: 2 });
      expectResultValue(
        version2Result,
        copyEntity(expectedEntity, {
          info: { updatedAt: updateResult.value.entity.info.updatedAt },
        }),
      );

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: expectedEntity.info.name,
          authKey: '',
          createdAt,
          valid: true,
        },
        fields: { ...emptyFooFields, title: 'Updated title' },
      });
    }
  });

  test('Update EntityAdminFoo w/o providing all fields', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'First name' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { createdAt },
        },
      } = createResult.value;

      const expectedEntity: Entity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: createResult.value.entity.info.name,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: {
          ...emptyFooFields,
          title: 'First title',
          summary: 'First summary',
        },
      };

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const updateResult = await client.updateEntity({
        id,
        fields: { summary: 'Updated summary' },
      });
      assertOkResult(updateResult);
      expectedEntity.info.version = 2;
      expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
      expectedEntity.fields.summary = 'Updated summary';
      expectResultValue(updateResult, {
        effect: 'updated',
        entity: expectedEntity,
      });

      const publishResult = await client.publishEntities([{ id, version: 2 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          {
            id,
            status: EntityStatus.published,
            effect: 'published',
            updatedAt,
          },
        ]);

        expectedEntity.info.status = EntityStatus.published;
        expectedEntity.info.updatedAt = updatedAt;
        expectedEntity.info.validPublished = true;
      }

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(
        version1Result,
        copyEntity(expectedEntity, {
          info: { version: 1, updatedAt: createdAt },
          fields: { summary: 'First summary' },
        }),
      );

      const version2Result = await client.getEntity({ id, version: 2 });
      expectResultValue(
        version2Result,
        copyEntity(expectedEntity, {
          info: { updatedAt: updateResult.value.entity.info.updatedAt },
        }),
      );

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: expectedEntity.info.name,
          authKey: '',
          createdAt,
          valid: true,
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
      info: { type: 'EntityAdminFoo', name: 'First name' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt },
        },
      } = createResult.value;

      const updateResult = await client.updateEntity({
        id,
        info: { name },
        fields: {},
      });
      expectResultValue(updateResult, {
        effect: 'none',
        entity: createResult.value.entity,
      });

      const publishResult = await client.publishEntities([{ id, version: 1 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          {
            id,
            status: EntityStatus.published,
            effect: 'published',
            updatedAt,
          },
        ]);
      }

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          authKey: '',
          createdAt,
          valid: true,
        },
        fields: {
          ...emptyFooFields,
          title: 'First title',
          summary: 'First summary',
        },
      });
    }
  });

  test('Update EntityAdminFoo normalizes empty string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Draft' },
      fields: { title: 'Hello' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const updateResult = await client.updateEntity({
        id,
        fields: { title: '' },
      });
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

  test('Update EntityAdminFoo normalizes empty component', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Draft' },
      fields: {},
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const expectedEntity: Entity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          version: 1,
          name: createResult.value.entity.info.name,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: createResult.value.entity.info.createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: { ...emptyBazFields },
      };

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const updateResult = await client.updateEntity({
        id,
        fields: { twoStrings: { type: 'EntityAdminTwoStrings' } },
      });
      if (expectOkResult(updateResult)) {
        expectedEntity.info.version = 2;
        expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
        expectedEntity.fields.twoStrings = {
          type: 'EntityAdminTwoStrings',
          one: null,
          two: null,
        };
      }
      expectResultValue(updateResult, {
        effect: 'updated',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Update EntityAdminFoo with reference', async () => {
    const createFooResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'First name' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    assertOkResult(createFooResult);

    const {
      entity: {
        id: fooId,
        info: { createdAt },
      },
    } = createFooResult.value;

    const expectedEntity: Entity = {
      id: fooId,
      info: {
        type: 'EntityAdminFoo',
        name: createFooResult.value.entity.info.name,
        version: 1,
        authKey: '',
        status: EntityStatus.draft,
        valid: true,
        validPublished: null,
        createdAt,
        updatedAt: createFooResult.value.entity.info.updatedAt,
      },
      fields: {
        ...emptyFooFields,
        title: 'First title',
        summary: 'First summary',
      },
    };

    expectResultValue(createFooResult, {
      effect: 'created',
      entity: expectedEntity,
    });

    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar entity' },
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
      assertOkResult(updateResult);
      expectedEntity.info.version = 2;
      expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
      expectedEntity.fields.bar = { id: barId };

      expectResultValue(updateResult, {
        effect: 'updated',
        entity: expectedEntity,
      });

      const publishResult = await client.publishEntities([
        { id: fooId, version: 2 },
        { id: barId, version: 1 },
      ]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt: fooUpdatedAt }, { updatedAt: barUpdatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          {
            id: fooId,
            status: EntityStatus.published,
            effect: 'published',
            updatedAt: fooUpdatedAt,
          },
          {
            id: barId,
            status: EntityStatus.published,
            effect: 'published',
            updatedAt: barUpdatedAt,
          },
        ]);
        expectedEntity.info.status = EntityStatus.published;
        expectedEntity.info.updatedAt = fooUpdatedAt;
        expectedEntity.info.validPublished = true;
      }

      const version1Result = await client.getEntity({ id: fooId, version: 1 });
      expectResultValue(
        version1Result,
        copyEntity(expectedEntity, {
          info: {
            version: 1,
            updatedAt: createFooResult.value.entity.info.createdAt,
          },
          fields: { bar: null },
        }),
      );

      const version2Result = await client.getEntity({ id: fooId, version: 2 });
      expectResultValue(
        version2Result,
        copyEntity(expectedEntity, {
          info: { updatedAt: updateResult.value.entity.info.updatedAt },
        }),
      );

      const publishedResult = await publishedClient.getEntity({ id: fooId });
      expectResultValue(publishedResult, {
        id: fooId,
        info: {
          type: 'EntityAdminFoo',
          name: expectedEntity.info.name,
          authKey: '',
          createdAt,
          valid: true,
        },
        fields: {
          title: 'First title',
          summary: 'First summary',
          bar: { id: barId },
        },
      });
    }
  });

  test('Update EntityAdminFoo without changing a reference', async () => {
    const createBar1Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar 1 entity' },
      fields: { title: 'Bar 1 entity' },
    });
    const createBar2Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar 2 entity' },
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
        { id: bar1Id, version: 1 },
        { id: bar2Id, version: 1 },
      ]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt: updatedAt1 }, { updatedAt: updatedAt2 }] = publishResult.value;
        expectResultValue(publishResult, [
          {
            id: bar1Id,
            status: EntityStatus.published,
            effect: 'published',
            updatedAt: updatedAt1,
          },
          {
            id: bar2Id,
            status: EntityStatus.published,
            effect: 'published',
            updatedAt: updatedAt2,
          },
        ]);
      }

      const createBazResult = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'First name' },
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

        const expectedEntity: Entity = {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: createBazResult.value.entity.info.name,
            version: 1,
            authKey: '',
            status: EntityStatus.draft,
            valid: true,
            validPublished: null,
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

        expectResultValue(createBazResult, {
          effect: 'created',
          entity: expectedEntity,
        });

        const updateResult = await client.updateEntity({
          id: bazId,
          fields: { title: 'Updated title' },
        });
        assertOkResult(updateResult);
        expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
        expectedEntity.info.version = 2;
        expectedEntity.fields.title = 'Updated title';

        expectResultValue(updateResult, {
          effect: 'updated',
          entity: expectedEntity,
        });

        const publishResult = await client.publishEntities([{ id: bazId, version: 2 }]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            {
              id: bazId,
              status: EntityStatus.published,
              effect: 'published',
              updatedAt,
            },
          ]);
          expectedEntity.info.status = EntityStatus.published;
          expectedEntity.info.updatedAt = updatedAt;
          expectedEntity.info.validPublished = true;
        }

        const version1Result = await client.getEntity({
          id: bazId,
          version: 1,
        });
        expectResultValue(
          version1Result,
          copyEntity(expectedEntity, {
            info: { version: 1, updatedAt: bazCreatedAt },
            fields: { title: 'First title' },
          }),
        );

        const version2Result = await client.getEntity({
          id: bazId,
          version: 2,
        });
        expectResultValue(
          version2Result,
          copyEntity(expectedEntity, {
            info: { updatedAt: updateResult.value.entity.info.updatedAt },
          }),
        );

        const publishedResult = await publishedClient.getEntity({ id: bazId });
        expectResultValue(publishedResult, {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: expectedEntity.info.name,
            authKey: '',
            createdAt: bazCreatedAt,
            valid: true,
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
      info: { type: 'EntityAdminFoo', name: 'Original' },
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
          status: EntityStatus.archived,
          effect: 'archived',
          updatedAt,
        });
      }

      const updateResult = await client.updateEntity({
        id,
        fields: { title: 'Updated title' },
      });

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
              version: 2,
              authKey: '',
              status: EntityStatus.archived,
              valid: true,
              validPublished: null,
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
      info: { type: 'EntityAdminFoo', name: 'Foo' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity,
        entity: { id },
      } = createResult.value;

      expectOkResult(await client.publishEntities([{ id, version: 1 }]));

      const updateResult = await client.updateEntity({
        id,
        fields: { title: 'Foo title' },
      });
      if (expectOkResult(updateResult)) {
        const {
          entity: {
            info: { updatedAt },
          },
        } = updateResult.value;
        expectResultValue(updateResult, {
          effect: 'none',
          entity: copyEntity(entity, {
            info: {
              authKey: '',
              status: EntityStatus.published,
              updatedAt,
              validPublished: true,
            },
          }),
        });
      }
    }
  });

  test('Error: Update EntityAdminFoo with reference to missing entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name' },
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
        'entity.fields.bar: Referenced entity (9783ca4f-f5b4-4f6a-a7bf-aae33e227841) doesn’t exist',
      );
    }
  });

  test('Error: Update EntityAdminFoo with reference to wrong entity type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;
      const referenceId = entitiesOfTypeAdminOnlyEditBeforeNone[0].id;

      const updateResult = await client.updateEntity({
        id,
        fields: { bar: { id: referenceId } },
      });
      expectErrorResult(
        updateResult,
        ErrorType.BadRequest,
        `entity.fields.bar: Referenced entity (${referenceId}) has an invalid type AdminOnlyEditBefore`,
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

      const updateResult = await clientOther.updateEntity({
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
        info: { type: 'EntityAdminBaz', name: 'Non-unique name' },
        fields: { title: 'Original title' },
      }),
    );

    const id = randomUUID();
    const upsertEntity = {
      id,
      info: { type: 'EntityAdminBaz', name: 'Non-unique name' },
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
      id: randomUUID(),
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
      'User not authorized to use authKey unauthorized',
    );
  });
});

describe('publishEntities()', () => {
  test('Archived entity', async () => {
    const createBaz1Result = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1' },
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
          status: EntityStatus.archived,
          effect: 'archived',
          updatedAt,
        });
      }

      const publishResult = await client.publishEntities([{ id, version }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          {
            id,
            status: EntityStatus.published,
            effect: 'published',
            updatedAt,
          },
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
              version: 1,
              authKey: '',
              status: EntityStatus.published,
              valid: true,
              validPublished: true,
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
      info: { type: 'EntityAdminBaz', name: 'Baz 1' },
      fields: { title: 'Baz title 1' },
    });
    if (expectOkResult(createBazResult)) {
      const {
        entity: { id: bazId },
      } = createBazResult.value;

      const firstPublishResult = await client.publishEntities([{ id: bazId, version: 1 }]);
      if (expectOkResult(firstPublishResult)) {
        const [{ updatedAt: firstPublishUpdatedAt }] = firstPublishResult.value;
        expectResultValue(firstPublishResult, [
          {
            id: bazId,
            status: EntityStatus.published,
            effect: 'published',
            updatedAt: firstPublishUpdatedAt,
          },
        ]);

        const secondPublishResult = await client.publishEntities([{ id: bazId, version: 1 }]);
        expectResultValue(secondPublishResult, [
          {
            id: bazId,
            status: EntityStatus.published,
            effect: 'none',
            updatedAt: firstPublishUpdatedAt,
          },
        ]);
      }
    }
  });

  test('Error: Reference to unpublished entity', async () => {
    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: {
        title: 'Bar title',
      },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: { id: barId },
      } = createBarResult.value;

      const createFooResult = await client.createEntity({
        info: { type: 'EntityAdminFoo', name: 'Foo name' },
        fields: {
          title: 'Foo title',
          bar: { id: barId },
        },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: { id: fooId },
        } = createFooResult.value;

        const publishResult = await client.publishEntities([{ id: fooId, version: 1 }]);
        expectErrorResult(
          publishResult,
          ErrorType.BadRequest,
          `${fooId}: References unpublished entities: ${barId}`,
        );
      }
    }
  });

  test('Error: adminOnly entity type', async () => {
    const createQuxResult = await client.createEntity({
      info: { type: 'EntityAdminQux', name: 'Qux name' },
      fields: {
        title: 'Qux title',
      },
    });
    if (expectOkResult(createQuxResult)) {
      const {
        entity: { id: quxId },
      } = createQuxResult.value;

      const publishResult = await client.publishEntities([{ id: quxId, version: 1 }]);
      expectErrorResult(publishResult, ErrorType.BadRequest, `Entity type is adminOnly: ${quxId}`);
    }
  });

  test('Error: missing value for required field in component', async () => {
    const createBazResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz name' },
      fields: {
        oneString: { type: 'EntityAdminOneString', one: null },
      },
    });
    if (expectOkResult(createBazResult)) {
      const {
        entity: { id: bazId },
      } = createBazResult.value;

      const publishResult = await client.publishEntities([{ id: bazId, version: 1 }]);
      expectErrorResult(
        publishResult,
        ErrorType.BadRequest,
        `entity(${bazId}).fields.oneString.one: Required field is empty`,
      );
    }
  });

  test('Error: missing value for required field in component in rich text', async () => {
    const createBazResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz name' },
      fields: {
        body: createRichText([
          createRichTextComponentNode({
            type: 'EntityAdminOneString',
            one: null,
          }),
        ]),
      },
    });
    if (expectOkResult(createBazResult)) {
      const {
        entity: { id: bazId },
      } = createBazResult.value;

      const publishResult = await client.publishEntities([{ id: bazId, version: 1 }]);
      expectErrorResult(
        publishResult,
        ErrorType.BadRequest,
        `entity(${bazId}).fields.body[0].data.one: Required field is empty`,
      );
    }
  });
});

describe('unpublishEntities()', () => {
  test('Unpublished entity referencing', async () => {
    const createBaz1Result = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1' },
      fields: {
        title: 'Baz title 1',
      },
    });
    if (expectOkResult(createBaz1Result)) {
      const {
        entity: { id: baz1Id },
      } = createBaz1Result.value;

      const createBaz2Result = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz 2' },
        fields: {
          title: 'Baz title 2',
          baz: { id: baz1Id },
        },
      });
      if (expectOkResult(createBaz2Result)) {
        const publishResult = await client.publishEntities([{ id: baz1Id, version: 1 }]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            {
              id: baz1Id,
              status: EntityStatus.published,
              effect: 'published',
              updatedAt,
            },
          ]);
        }

        const unpublishResult = await client.unpublishEntities([{ id: baz1Id }]);
        if (expectOkResult(unpublishResult)) {
          const [{ updatedAt }] = unpublishResult.value;
          expectResultValue(unpublishResult, [
            {
              id: baz1Id,
              status: EntityStatus.withdrawn,
              effect: 'unpublished',
              updatedAt,
            },
          ]);
        }
      }
    }
  });
});

describe('unarchiveEntity()', () => {
  test('Unarchive new entity (does nothing)', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
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
          status: EntityStatus.draft,
          effect: 'none',
          updatedAt,
        });
      }
    }
  });

  test('Unarchive archived entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
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
          status: EntityStatus.archived,
          effect: 'archived',
          updatedAt,
        });
      }

      const unarchiveResult = await client.unarchiveEntity({ id });
      if (expectOkResult(unarchiveResult)) {
        const { updatedAt } = unarchiveResult.value;
        expectResultValue(unarchiveResult, {
          id,
          status: EntityStatus.draft,
          effect: 'unarchived',
          updatedAt,
        });

        const getResult = await client.getEntity({ id });
        if (expectOkResult(getResult)) {
          expectResultValue(getResult, {
            id,
            info: {
              name,
              type: 'EntityAdminBar',
              version: 1,
              authKey: '',
              status: EntityStatus.draft,
              valid: true,
              validPublished: null,
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
      info: { type: 'EntityAdminBar', name: 'Bar name' },
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
          {
            id,
            status: EntityStatus.published,
            effect: 'published',
            updatedAt,
          },
        ]);
      }

      const unpublishResult = await client.unpublishEntities([{ id }]);
      if (expectOkResult(unpublishResult)) {
        const [{ updatedAt }] = unpublishResult.value;
        expectResultValue(unpublishResult, [
          {
            id,
            status: EntityStatus.withdrawn,
            effect: 'unpublished',
            updatedAt,
          },
        ]);
      }

      const archiveResult = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          status: EntityStatus.archived,
          effect: 'archived',
          updatedAt,
        });
      }

      const unarchiveResult = await client.unarchiveEntity({ id });
      if (expectOkResult(unarchiveResult)) {
        const { updatedAt } = unarchiveResult.value;
        expectResultValue(unarchiveResult, {
          id,
          status: EntityStatus.withdrawn,
          effect: 'unarchived',
          updatedAt,
        });
      }
    }
  });
});
