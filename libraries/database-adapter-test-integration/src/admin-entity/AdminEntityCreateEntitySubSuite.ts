import {
  AdminEntityStatus,
  copyEntity,
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextNode,
  ErrorType,
} from '@jonasb/datadata-core';
import { v4 as uuidv4 } from 'uuid';
import {
  assertEquals,
  assertErrorResult,
  assertNotSame,
  assertOkResult,
  assertResultValue,
  assertTruthy,
} from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type {
  AdminLocations,
  AdminReferences,
  AdminRichTexts,
  AdminStrings,
  AdminTitleOnly,
} from '../SchemaTypes.js';
import {
  assertIsAdminLocations,
  assertIsAdminReferences,
  assertIsAdminRichTexts,
  assertIsAdminStrings,
  assertIsAdminTitleOnly,
} from '../SchemaTypes.js';
import {
  LOCATIONS_ADMIN_ENTITY,
  LOCATIONS_CREATE,
  REFERENCES_ADMIN_ENTITY,
  REFERENCES_CREATE,
  RICH_TEXTS_ADMIN_ENTITY,
  RICH_TEXTS_CREATE,
  STRINGS_ADMIN_ENTITY,
  STRINGS_CREATE,
  TITLE_ONLY_ADMIN_ENTITY,
  TITLE_ONLY_CREATE,
} from '../shared-entity/Fixtures.js';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const CreateEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  createEntity_minimal,
  createEntity_withId,
  createEntity_duplicateName,
  createEntity_fiveInParallelWithSameName,
  createEntity_publishMinimal,
  createEntity_publishWithSubjectAuthKey,
  createEntity_withMultilineField,
  createEntity_withRichTextField,
  createEntity_withTwoReferences,
  createEntity_withMultipleLocations,
  createEntity_errorMultilineStringInTitle,
  createEntity_errorPublishWithoutRequiredTitle,
];

async function createEntity_minimal({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity<AdminTitleOnly>(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(TITLE_ONLY_ADMIN_ENTITY, {
    id,
    info: {
      name,
      createdAt,
      updatedAt,
    },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminTitleOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withId({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const id = uuidv4();
  const createResult = await client.createEntity<AdminTitleOnly>(
    copyEntity(TITLE_ONLY_CREATE, { id })
  );
  assertOkResult(createResult);
  const {
    entity: {
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(TITLE_ONLY_ADMIN_ENTITY, {
    id,
    info: {
      name,
      createdAt,
      updatedAt,
    },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminTitleOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_duplicateName({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const firstResult = await client.createEntity(TITLE_ONLY_CREATE);
  const secondResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(firstResult);
  assertOkResult(secondResult);

  const {
    entity: {
      id: firstId,
      info: { name: firstName },
    },
  } = firstResult.value;
  const {
    entity: {
      id: secondId,
      info: { name: secondName },
    },
  } = secondResult.value;
  assertNotSame(firstId, secondId);
  assertNotSame(firstName, secondName);

  assertTruthy(secondName.match(/^TitleOnly name#\d{8}$/));
}

async function createEntity_fiveInParallelWithSameName({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const results = await Promise.all(
    [1, 2, 3, 4, 5].map((num) =>
      client.createEntity(copyEntity(TITLE_ONLY_CREATE, { fields: { title: `Title ${num}` } }))
    )
  );
  for (const result of results) {
    assertOkResult(result);
  }
}

async function createEntity_publishMinimal({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity<AdminTitleOnly>(TITLE_ONLY_CREATE, {
    publish: true,
  });
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(TITLE_ONLY_ADMIN_ENTITY, {
    id,
    info: {
      name,
      status: AdminEntityStatus.published,
      createdAt,
      updatedAt,
    },
  });

  assertResultValue(createResult, {
    effect: 'createdAndPublished',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminTitleOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_publishWithSubjectAuthKey({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity<AdminTitleOnly>(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } }),
    { publish: true }
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(TITLE_ONLY_ADMIN_ENTITY, {
    id,
    info: {
      name,
      status: AdminEntityStatus.published,
      authKey: 'subject',
      createdAt,
      updatedAt,
    },
  });

  assertResultValue(createResult, {
    effect: 'createdAndPublished',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminTitleOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withMultilineField({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity<AdminStrings>(
    copyEntity(STRINGS_CREATE, { fields: { multiline: 'one\ntwo\nthree' } })
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(STRINGS_ADMIN_ENTITY, {
    id,
    info: { name, createdAt, updatedAt },
    fields: { multiline: 'one\ntwo\nthree' },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminStrings(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withRichTextField({ server }: AdminEntityTestContext) {
  const richText = createRichTextRootNode([
    createRichTextParagraphNode([createRichTextTextNode('Hello world')]),
  ]);
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity<AdminRichTexts>(
    copyEntity(RICH_TEXTS_CREATE, {
      fields: {
        default: richText,
      },
    })
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(RICH_TEXTS_ADMIN_ENTITY, {
    id,
    info: { name, createdAt, updatedAt },
    fields: { default: richText },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminRichTexts(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withTwoReferences({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createTitleOnly1Result = await client.createEntity(TITLE_ONLY_CREATE);
  const createTitleOnly2Result = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createTitleOnly1Result);
  assertOkResult(createTitleOnly2Result);
  const {
    entity: { id: idTitleOnly1 },
  } = createTitleOnly1Result.value;
  const {
    entity: { id: idTitleOnly2 },
  } = createTitleOnly2Result.value;

  const createResult = await client.createEntity<AdminReferences>(
    copyEntity(REFERENCES_CREATE, {
      fields: { any: { id: idTitleOnly1 }, titleOnly: { id: idTitleOnly2 } },
    })
  );

  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(REFERENCES_ADMIN_ENTITY, {
    id,
    info: {
      name,
      createdAt,
      updatedAt,
    },
    fields: {
      any: { id: idTitleOnly1 },
      titleOnly: { id: idTitleOnly2 },
    },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminReferences(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withMultipleLocations({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity<AdminLocations>(
    copyEntity(LOCATIONS_CREATE, {
      fields: {
        location: { lat: 1, lng: 2 },
        locationList: [
          { lat: 3, lng: 4 },
          { lat: -179, lng: -178 },
        ],
      },
    })
  );

  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(LOCATIONS_ADMIN_ENTITY, {
    id,
    info: {
      name,
      createdAt,
      updatedAt,
    },
    fields: {
      location: { lat: 1, lng: 2 },
      locationList: [
        { lat: 3, lng: 4 },
        { lat: -179, lng: -178 },
      ],
    },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminLocations(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_errorMultilineStringInTitle({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const id = uuidv4();
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { id, fields: { title: 'Hello\nWorld\n' } })
  );
  assertErrorResult(
    createResult,
    ErrorType.BadRequest,
    'entity.fields.title: multiline string not allowed'
  );

  const getResult = await client.getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotFound, 'No such entity');
}

async function createEntity_errorPublishWithoutRequiredTitle({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const id = uuidv4();
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { id, fields: { title: null } }),
    { publish: true }
  );
  assertErrorResult(
    createResult,
    ErrorType.BadRequest,
    `entity(${id}).fields.title: Required field is empty`
  );

  const getResult = await client.getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotFound, 'No such entity');
}
