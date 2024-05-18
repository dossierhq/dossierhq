import {
  assertOkResult,
  copyEntity,
  ErrorType,
  EventType,
  getAllNodesForConnection,
  type EntityChangelogEvent,
} from '@dossierhq/core';
import { assertEquals, assertErrorResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  STRINGS_CREATE,
  SUBJECT_ONLY_CREATE,
  TITLE_ONLY_CREATE,
} from '../shared-entity/Fixtures.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const DeleteEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  deleteEntity_minimal,
  deleteEntity_releasesId,
  deleteEntity_releasesName,
  deleteEntity_releasesUniqueIndexValue,
  deleteEntity_deleteEntityEvent,
  deleteEntity_errorInvalidReference,
  deleteEntity_errorWrongAuthKey,
  deleteEntity_errorDraftEntity,
  deleteEntity_errorReadonlySession,
];

async function deleteEntity_minimal({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const {
    entity: { id },
  } = (await client.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();

  assertOkResult(await client.archiveEntity({ id }));

  const result = await client.deleteEntity({ id });
  const { deletedAt } = result.valueOrThrow();
  assertResultValue(result, { effect: 'deleted', deletedAt });
}

async function deleteEntity_releasesId({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const {
    entity: { id },
  } = (await client.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();

  assertOkResult(await client.archiveEntity({ id }));
  assertOkResult(await client.deleteEntity({ id }));

  assertErrorResult(await client.getEntity({ id }), ErrorType.NotFound, 'No such entity');

  assertOkResult(await client.createEntity(copyEntity(STRINGS_CREATE, { id })));
}

async function deleteEntity_releasesName({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const {
    entity: {
      id,
      info: { name },
    },
  } = (await client.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();

  assertOkResult(await client.archiveEntity({ id }));
  assertOkResult(await client.deleteEntity({ id }));

  // If delete didn't release the name we would get another unique name here
  const createResult = await client.createEntity(copyEntity(STRINGS_CREATE, { info: { name } }));
  assertEquals(name, createResult.valueOrThrow().entity.info.name);
}

async function deleteEntity_releasesUniqueIndexValue({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const uniqueValue = crypto.randomUUID();

  const {
    entity: { id },
  } = (
    await client.createEntity(copyEntity(STRINGS_CREATE, { fields: { unique: uniqueValue } }))
  ).valueOrThrow();

  assertOkResult(await client.archiveEntity({ id }));
  assertOkResult(await client.deleteEntity({ id }));

  // Since delete entity releases the unique value we can create a new entity with the same unique value
  const { entity: secondEntity } = (
    await client.createEntity(copyEntity(STRINGS_CREATE, { fields: { unique: uniqueValue } }))
  ).valueOrThrow();
  const getResult = await client.getEntity({ index: 'stringsUnique', value: uniqueValue });
  assertResultValue(getResult, secondEntity);
}

async function deleteEntity_deleteEntityEvent({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const {
    entity: {
      id,
      info: { name },
    },
  } = (await client.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();

  assertOkResult(await client.archiveEntity({ id }));

  const result = await client.deleteEntity({ id });
  const { deletedAt } = result.valueOrThrow();

  // Can't use the entity filter since it's deleted, but we can still find it by searching
  let matchEvent: EntityChangelogEvent | null = null;
  for await (const node of getAllNodesForConnection({}, (paging) =>
    client.getChangelogEvents({ types: ['deleteEntity'], reverse: true }, paging),
  )) {
    if (node.isError()) {
      continue;
    }
    const event = node.value;
    if (event.type === EventType.deleteEntity && event.entities[0].id === id) {
      matchEvent = event;
      break;
    }
  }

  assertEquals(matchEvent, {
    id: matchEvent!.id,
    createdAt: deletedAt,
    createdBy: matchEvent!.createdBy,
    type: EventType.deleteEntity,
    unauthorizedEntityCount: 0,
    entities: [{ id, name, type: 'TitleOnly', version: 1 }],
  });
}

async function deleteEntity_errorInvalidReference({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider.dossierClient().deleteEntity({
    id: '5b14e69f-6612-4ddb-bb42-7be273104486',
  });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function deleteEntity_errorWrongAuthKey({ clientProvider }: AdminEntityTestContext) {
  const createResult = await clientProvider.dossierClient().createEntity(SUBJECT_ONLY_CREATE);
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const deleteResult = await clientProvider.dossierClient('secondary').deleteEntity({ id });
  assertErrorResult(deleteResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
}

async function deleteEntity_errorDraftEntity({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const deleteResult = await client.deleteEntity({ id });
  assertErrorResult(deleteResult, ErrorType.BadRequest, 'Entity is not archived (status: draft)');
}

async function deleteEntity_errorReadonlySession({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient('main', 'readonly');
  const createResult = await client.deleteEntity({ id: '5b14e69f-6612-4ddb-bb42-7be273104486' });
  assertErrorResult(createResult, ErrorType.BadRequest, 'Readonly session used to delete entity');
}
