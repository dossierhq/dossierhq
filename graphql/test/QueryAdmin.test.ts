import { EntityAdmin, EntityFieldType, ErrorType, notOk, ok, TestUtils } from '@datadata/core';
import type {
  AdminEntity,
  AdminFilter,
  Connection,
  Edge,
  Instance,
  Paging,
  SessionContext,
} from '@datadata/core';
import { graphql, printError } from 'graphql';
import type { GraphQLSchema } from 'graphql';
import { GraphQLSchemaGenerator } from '../src/GraphQLSchemaGenerator';

const { createTestInstance, ensureSessionContext, expectOkResult, updateSchema } = TestUtils;

let instance: Instance;
let context: SessionContext;
let schema: GraphQLSchema;
let entitiesOfTypeQueryAdminOnlyEditBefore: AdminEntity[];

beforeAll(async () => {
  instance = await createTestInstance({ loadSchema: true });
  context = await ensureSessionContext(instance, 'test', 'query');
  await updateSchema(context, {
    QueryAdminFoo: {
      fields: [
        { name: 'title', type: EntityFieldType.String, isName: true },
        { name: 'summary', type: EntityFieldType.String },
        { name: 'bar', type: EntityFieldType.Reference, entityTypes: ['QueryAdminBar'] },
      ],
    },
    QueryAdminBar: { fields: [{ name: 'title', type: EntityFieldType.String }] },
    QueryAdminOnlyEditBefore: { fields: [{ name: 'message', type: EntityFieldType.String }] },
  });
  schema = new GraphQLSchemaGenerator(context.instance.getSchema()).buildSchema();

  await ensureTestEntitiesExist(context);
  entitiesOfTypeQueryAdminOnlyEditBefore = await getEntitiesForAdminOnlyEditBefore(context);
});
afterAll(async () => {
  await instance?.shutdown();
});

async function ensureTestEntitiesExist(context: SessionContext) {
  const requestedCount = 50;
  const entitiesOfTypeCount = await EntityAdmin.getTotalCount(context, {
    entityTypes: ['QueryAdminOnlyEditBefore'],
  });

  if (expectOkResult(entitiesOfTypeCount)) {
    for (let count = entitiesOfTypeCount.value; count < requestedCount; count += 1) {
      const random = String(Math.random()).slice(2);
      const createResult = await EntityAdmin.createEntity(
        context,
        { _type: 'QueryAdminOnlyEditBefore', _name: random, message: `Hey ${random}` },
        { publish: true }
      );
      createResult.throwIfError();
    }
  }
}

async function getEntitiesForAdminOnlyEditBefore(context: SessionContext) {
  const entities: AdminEntity[] = [];
  await visitAllEntityPages(
    context,
    { entityTypes: ['QueryAdminOnlyEditBefore'] },
    (connection) => {
      for (const edge of connection.edges) {
        if (edge.node.isOk()) {
          entities.push(edge.node.value);
        }
      }
    }
  );
  return entities;
}

async function visitAllEntityPages(
  context: SessionContext,
  filter: AdminFilter,
  visitor: (connection: Connection<Edge<AdminEntity, ErrorType>>) => void
) {
  const paging: Paging = {};
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await EntityAdmin.searchEntities(context, filter, paging);
    if (result.isError()) {
      throw result.toError();
    }
    if (result.value === null) {
      return;
    }

    visitor(result.value);
    paging.after = result.value.pageInfo.endCursor;
    if (!result.value.pageInfo.hasNextPage) {
      return;
    }
  }
}

describe('QueryAdminFoo', () => {
  test('Query all fields of created entity', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'QueryAdminFoo',
        _name: 'Howdy name',
        title: 'Howdy title',
        summary: 'Howdy summary',
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const result = await graphql(
        schema,
        `
          query AdminEntity($id: ID!) {
            adminEntity(id: $id) {
              __typename
              id
              _type
              _name
              _version
              ... on AdminQueryAdminFoo {
                title
                summary
              }
            }
          }
        `,
        undefined,
        { context: ok(context) },
        { id }
      );
      expect(result).toEqual({
        data: {
          adminEntity: {
            __typename: 'AdminQueryAdminFoo',
            id,
            _version: 0,
            _type: 'QueryAdminFoo',
            _name: 'Howdy name',
            title: 'Howdy title',
            summary: 'Howdy summary',
          },
        },
      });
    }
  });

  test('Query null fields of created entity', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'QueryAdminFoo', _name: 'Howdy name' },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const result = await graphql(
        schema,
        `
          query AdminEntity($id: ID!) {
            adminEntity(id: $id) {
              __typename
              id
              _type
              _name
              _version
              ... on AdminQueryAdminFoo {
                title
                summary
              }
            }
          }
        `,
        undefined,
        { context: ok(context) },
        { id }
      );
      expect(result).toEqual({
        data: {
          adminEntity: {
            __typename: 'AdminQueryAdminFoo',
            id,
            _type: 'QueryAdminFoo',
            _name: 'Howdy name',
            _version: 0,
            title: null,
            summary: null,
          },
        },
      });
    }
  });

  test('Query different versions of same entity created entity', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'QueryAdminFoo',
        _name: 'First name',
        title: 'First title',
        summary: 'First summary',
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      expectOkResult(
        await EntityAdmin.updateEntity(
          context,
          { id, title: 'Second title', summary: 'Second summary' },
          { publish: true }
        )
      );

      const result = await graphql(
        schema,
        `
          query TwoVersionsOfAdminEntity(
            $id: ID!
            $version1: Int!
            $version2: Int!
            $version3: Int!
            $version4: Int
          ) {
            first: adminEntity(id: $id, version: $version1) {
              id
              _version
              ... on AdminQueryAdminFoo {
                title
                summary
              }
            }
            second: adminEntity(id: $id, version: $version2) {
              id
              _version
              ... on AdminQueryAdminFoo {
                title
                summary
              }
            }
            third: adminEntity(id: $id, version: $version3) {
              id
              _version
              ... on AdminQueryAdminFoo {
                title
                summary
              }
            }
            fourth: adminEntity(id: $id, version: $version4) {
              id
              _version
              ... on AdminQueryAdminFoo {
                title
                summary
              }
            }
          }
        `,
        undefined,
        { context: ok(context) },
        { id, version1: 0, version2: 1, version3: 100, version4: null }
      );
      expect(result.data).toEqual({
        first: {
          id,
          _version: 0,
          title: 'First title',
          summary: 'First summary',
        },
        second: {
          id,
          _version: 1,
          title: 'Second title',
          summary: 'Second summary',
        },
        third: null, // invalid version
        fourth: {
          //default to max
          id,
          _version: 1,
          title: 'Second title',
          summary: 'Second summary',
        },
      });
      const errorStrings = result.errors?.map(printError);
      expect(errorStrings).toMatchInlineSnapshot(`
        Array [
          "NotFound: No such entity or version

        GraphQL request:25:13
        24 |             }
        25 |             third: adminEntity(id: $id, version: $version3) {
           |             ^
        26 |               id",
        ]
      `);
    }
  });

  test('Query referenced entity', async () => {
    const createBarResult = await EntityAdmin.createEntity(
      context,
      { _type: 'QueryAdminBar', _name: 'Bar name', title: 'Bar title' },
      { publish: true }
    );
    if (expectOkResult(createBarResult)) {
      const barId = createBarResult.value.id;

      const createFooResult = await EntityAdmin.createEntity(
        context,
        { _type: 'QueryAdminFoo', _name: 'Foo name', title: 'Foo title', bar: { id: barId } },
        { publish: true }
      );
      if (expectOkResult(createFooResult)) {
        const fooId = createFooResult.value.id;

        const result = await graphql(
          schema,
          `
            query Entity($id: ID!) {
              adminEntity(id: $id) {
                __typename
                id
                _type
                _name
                _version
                ... on AdminQueryAdminFoo {
                  title
                  bar {
                    __typename
                    id
                    _type
                    _name
                    title
                  }
                }
              }
            }
          `,
          undefined,
          { context: ok(context) },
          { id: fooId }
        );
        expect(result).toEqual({
          data: {
            adminEntity: {
              __typename: 'AdminQueryAdminFoo',
              id: fooId,
              _type: 'QueryAdminFoo',
              _name: 'Foo name',
              _version: 0,
              title: 'Foo title',
              bar: {
                __typename: 'AdminQueryAdminBar',
                id: barId,
                _type: 'QueryAdminBar',
                _name: 'Bar name',
                title: 'Bar title',
              },
            },
          },
        });
      }
    }
  });

  test('Error: Query invalid id', async () => {
    const result = await graphql(
      schema,
      `
        query AdminEntity($id: ID!) {
          adminEntity(id: $id) {
            id
          }
        }
      `,
      undefined,
      { context: ok(context) },
      { id: '6043cb20-50dc-43d9-8d55-fc9b892b30af' }
    );
    expect(result.data).toEqual({
      adminEntity: null,
    });
    const errorStrings = result.errors?.map(printError);
    expect(errorStrings).toEqual([
      `NotFound: No such entity

GraphQL request:3:11
2 |         query AdminEntity($id: ID!) {
3 |           adminEntity(id: $id) {
  |           ^
4 |             id`,
    ]);
  });

  test('Error: No session', async () => {
    const result = await graphql(
      schema,
      `
        query AdminEntity($id: ID!) {
          adminEntity(id: $id) {
            id
          }
        }
      `,
      undefined,
      { context: notOk.NotAuthenticated('No session') },
      { id: '6043cb20-50dc-43d9-8d55-fc9b892b30af' }
    );
    expect(result.data).toEqual({
      adminEntity: null,
    });
    const errorStrings = result.errors?.map(printError);
    expect(errorStrings).toEqual([
      `NotAuthenticated: No session

GraphQL request:3:11
2 |         query AdminEntity($id: ID!) {
3 |           adminEntity(id: $id) {
  |           ^
4 |             id`,
    ]);
  });
});

describe('searchAdminEntities()', () => {
  test('Default => 25', async () => {
    const result = await graphql(
      schema,
      `
        {
          adminSearchEntities(filter: { entityTypes: ["QueryAdminOnlyEditBefore"] }) {
            totalCount
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      undefined,
      { context: ok(context) }
    );
    expect(result.data?.adminSearchEntities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBefore.slice(0, 25).map((x) => ({ node: { id: x.id } }))
    );
    expect(result.data?.adminSearchEntities.totalCount).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBefore.length
    );
  });

  test('first 10', async () => {
    const result = await graphql(
      schema,
      `
        {
          adminSearchEntities(filter: { entityTypes: ["QueryAdminOnlyEditBefore"] }, first: 10) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      undefined,
      { context: ok(context) }
    );
    expect(result.data?.adminSearchEntities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBefore.slice(0, 10).map((x) => ({ node: { id: x.id } }))
    );
  });

  test('last 10', async () => {
    const result = await graphql(
      schema,
      `
        {
          adminSearchEntities(filter: { entityTypes: ["QueryAdminOnlyEditBefore"] }, last: 10) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      undefined,
      { context: ok(context) }
    );
    expect(result.data?.adminSearchEntities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBefore.slice(-10).map((x) => ({ node: { id: x.id } }))
    );
  });
});

describe('versionHistory()', () => {
  test('History with edit and unpublished delete', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'QueryAdminFoo', _name: 'Foo name', title: 'First title' },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const updateResult = await EntityAdmin.updateEntity(
        context,
        { id, title: 'Updated title' },
        { publish: true }
      );
      expectOkResult(updateResult);

      const deleteResult = await EntityAdmin.deleteEntity(context, id, { publish: false });
      expectOkResult(deleteResult);

      const result = await graphql(
        schema,
        `
          query VersionHistory($id: ID!) {
            versionHistory(id: $id) {
              id
              type
              name
              versions {
                version
                deleted
                published
                createdBy
                createdAt
              }
            }
          }
        `,
        undefined,
        { context: ok(context) },
        { id }
      );
      // Remove createdAt since it's tricky to test 🤷‍♂️
      result.data?.versionHistory.versions.forEach(
        (x: { createdAt?: string }) => delete x.createdAt
      );

      expect(result.data).toEqual({
        versionHistory: {
          id,
          name: 'Foo name',
          type: 'QueryAdminFoo',
          versions: [
            { createdBy: context.session.subjectId, deleted: false, published: false, version: 0 },
            { createdBy: context.session.subjectId, deleted: false, published: true, version: 1 },
            { createdBy: context.session.subjectId, deleted: true, published: false, version: 2 },
          ],
        },
      });
    }
  });
});
