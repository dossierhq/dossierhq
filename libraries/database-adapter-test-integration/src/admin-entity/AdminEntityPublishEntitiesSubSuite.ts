import type { ValueItem } from '@jonasb/datadata-core';
import { AdminEntityStatus, copyEntity, ErrorType } from '@jonasb/datadata-core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  REFERENCES_CREATE,
  TITLE_ONLY_CREATE,
  VALUE_ITEMS_CREATE,
} from '../shared-entity/Fixtures.js';
import {
  adminClientForMainPrincipal,
  adminClientForSecondaryPrincipal,
} from '../shared-entity/TestClients.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const PublishEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  publishEntities_minimal,
  publishEntities_authKeySubject,
  publishEntities_oldVersion,
  publishEntities_twoEntitiesReferencingEachOther,
  publishEntities_publishAlreadyPublishedEntity,
  publishEntities_publishWithAdminOnlyFieldReferencingDraftEntity,
  publishEntities_adminOnlyFieldWithAdminOnlyValueItem,
  publishEntities_errorInvalidId,
  publishEntities_errorDuplicateIds,
  publishEntities_errorMissingRequiredTitle,
  publishEntities_errorWrongAuthKey,
  publishEntities_errorAdminOnlyTypeItem,
];

async function publishEntities_minimal({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.value;

  const publishResult = await client.publishEntities([{ id, version }]);
  assertOkResult(publishResult);
  const [{ updatedAt }] = publishResult.value;
  assertResultValue(publishResult, [
    {
      id,
      effect: 'published',
      status: AdminEntityStatus.published,
      updatedAt,
    },
  ]);

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: { status: AdminEntityStatus.published, updatedAt },
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function publishEntities_authKeySubject({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.value;

  const publishResult = await client.publishEntities([{ id, version }]);
  assertOkResult(publishResult);
  const [{ updatedAt }] = publishResult.value;
  assertResultValue(publishResult, [
    {
      id,
      effect: 'published',
      status: AdminEntityStatus.published,
      updatedAt,
    },
  ]);

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: { status: AdminEntityStatus.published, updatedAt },
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function publishEntities_oldVersion({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });
  assertOkResult(updateResult);

  const publishResult = await client.publishEntities([{ id, version: 0 }]);
  assertOkResult(publishResult);
  const [{ updatedAt }] = publishResult.value;
  assertResultValue(publishResult, [
    {
      id,
      effect: 'published',
      status: AdminEntityStatus.modified,
      updatedAt,
    },
  ]);

  const expectedEntity = copyEntity(updateResult.value.entity, {
    info: { status: AdminEntityStatus.modified, updatedAt },
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function publishEntities_twoEntitiesReferencingEachOther({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const create1Result = await client.createEntity(REFERENCES_CREATE);
  assertOkResult(create1Result);
  const {
    entity: { id: id1 },
  } = create1Result.value;

  const create2Result = await client.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { any: { id: id1 } } })
  );
  assertOkResult(create2Result);
  const {
    entity: { id: id2 },
  } = create2Result.value;

  const update1Result = await client.updateEntity({ id: id1, fields: { any: { id: id2 } } });
  assertOkResult(update1Result);

  const publishResult = await client.publishEntities([
    { id: id1, version: 1 },
    { id: id2, version: 0 },
  ]);
  assertOkResult(publishResult);
  const [{ updatedAt: updatedAt1 }, { updatedAt: updatedAt2 }] = publishResult.value;
  assertResultValue(publishResult, [
    {
      id: id1,
      effect: 'published',
      status: AdminEntityStatus.published,
      updatedAt: updatedAt1,
    },
    {
      id: id2,
      effect: 'published',
      status: AdminEntityStatus.published,
      updatedAt: updatedAt2,
    },
  ]);

  const expected1Entity = copyEntity(update1Result.value.entity, {
    info: { status: AdminEntityStatus.published, updatedAt: updatedAt1 },
  });

  const getResult = await client.getEntity({ id: id1 });
  assertResultValue(getResult, expected1Entity);
}

async function publishEntities_publishAlreadyPublishedEntity({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });
  assertOkResult(updateResult);
  const {
    entity: {
      info: { version },
    },
  } = updateResult.value;

  const publishResult = await client.publishEntities([{ id, version }]);
  assertOkResult(publishResult);
  const [{ updatedAt }] = publishResult.value;
  assertResultValue(publishResult, [
    {
      id,
      effect: 'published',
      status: AdminEntityStatus.published,
      updatedAt,
    },
  ]);

  const expectedEntity = copyEntity(updateResult.value.entity, {
    info: { status: AdminEntityStatus.published, updatedAt },
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function publishEntities_publishWithAdminOnlyFieldReferencingDraftEntity({
  server,
}: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const {
    entity: { id: draftId },
  } = (await client.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();

  const {
    entity: {
      id,
      info: { version },
    },
  } = (
    await client.createEntity(
      copyEntity(REFERENCES_CREATE, { fields: { anyAdminOnly: { id: draftId } } })
    )
  ).valueOrThrow();

  const publishResult = await client.publishEntities([{ id, version }]);
  assertOkResult(publishResult);
}

async function publishEntities_adminOnlyFieldWithAdminOnlyValueItem({
  server,
}: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const adminOnlyValueItem: ValueItem = { type: 'AdminOnlyValue' };
  const createResult = await client.createEntity(
    copyEntity(VALUE_ITEMS_CREATE, { fields: { anyAdminOnly: adminOnlyValueItem } })
  );
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.valueOrThrow();

  const publishResult = await client.publishEntities([{ id, version }]);
  assertOkResult(publishResult);
}

async function publishEntities_errorInvalidId({ server }: AdminEntityTestContext) {
  const publishResult = await adminClientForMainPrincipal(server).publishEntities([
    { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290', version: 0 },
  ]);
  assertErrorResult(
    publishResult,
    ErrorType.NotFound,
    'No such entities: b1bdcb61-e6aa-47ff-98d8-4cfe8197b290'
  );
}

async function publishEntities_errorDuplicateIds({ server }: AdminEntityTestContext) {
  const publishResult = await adminClientForMainPrincipal(server).publishEntities([
    { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290', version: 0 },
    { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290', version: 1 },
  ]);
  assertErrorResult(
    publishResult,
    ErrorType.BadRequest,
    'Duplicate ids: b1bdcb61-e6aa-47ff-98d8-4cfe8197b290'
  );
}

async function publishEntities_errorMissingRequiredTitle({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { fields: { title: null } })
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.value;

  const publishResult = await client.publishEntities([{ id, version }]);
  assertErrorResult(
    publishResult,
    ErrorType.BadRequest,
    `entity(${id}).fields.title: Required field is empty`
  );
}

async function publishEntities_errorWrongAuthKey({ server }: AdminEntityTestContext) {
  const createResult = await adminClientForMainPrincipal(server).createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.value;

  const publishResult = await adminClientForSecondaryPrincipal(server).publishEntities([
    { id, version },
  ]);
  assertErrorResult(
    publishResult,
    ErrorType.NotAuthorized,
    `entity(${id}): Wrong authKey provided`
  );
}

async function publishEntities_errorAdminOnlyTypeItem({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const adminOnlyValueItem: ValueItem = { type: 'AdminOnlyValue' };
  const createResult = await client.createEntity(
    copyEntity(VALUE_ITEMS_CREATE, { fields: { any: adminOnlyValueItem } })
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.value;

  const publishResult = await client.publishEntities([{ id, version }]);
  assertErrorResult(
    publishResult,
    ErrorType.BadRequest,
    `entity(${id}).fields.any: Value item of type AdminOnlyValue is adminOnly`
  );
}
