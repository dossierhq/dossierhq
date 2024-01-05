import { AdminEntityStatus, copyEntity, ErrorType, EventType } from '@dossierhq/core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import { assertChangelogEventsConnection } from '../shared-entity/EventsTestUtils.js';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const UnarchiveEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  unarchiveEntity_minimal,
  unarchiveEntity_unarchiveEntityEvent,
  unarchiveEntity_previouslyPublished,
  unarchiveEntity_errorInvalidId,
  unarchiveEntity_errorWrongAuthKey,
];

async function unarchiveEntity_minimal({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  const { entity } = createResult.valueOrThrow();
  const reference = { id: entity.id };

  const archiveResult = await client.archiveEntity(reference);
  assertOkResult(archiveResult);

  const unarchiveResult = await client.unarchiveEntity(reference);
  const { updatedAt } = unarchiveResult.valueOrThrow();
  assertResultValue(unarchiveResult, {
    id: reference.id,
    effect: 'unarchived',
    status: AdminEntityStatus.draft,
    updatedAt,
  });

  const expectedEntity = copyEntity(entity, {
    info: { status: AdminEntityStatus.draft, updatedAt },
  });

  const getResult = await client.getEntity(reference);
  assertResultValue(getResult, expectedEntity);
}

async function unarchiveEntity_unarchiveEntityEvent({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  const {
    entity: {
      id,
      info: { createdAt, name, version },
    },
  } = createResult.valueOrThrow();

  const archiveResult = await client.archiveEntity({ id });
  const { updatedAt: archiveUpdatedAt } = archiveResult.valueOrThrow();

  const unarchiveResult = await client.unarchiveEntity({ id });
  assertOkResult(unarchiveResult);
  const { updatedAt: unarchiveUpdatedAt } = unarchiveResult.valueOrThrow();
  assertResultValue(unarchiveResult, {
    id,
    effect: 'unarchived',
    status: AdminEntityStatus.draft,
    updatedAt: unarchiveUpdatedAt,
  });

  const connectionResult = await client.getChangelogEvents({ entity: { id } });
  assertChangelogEventsConnection(connectionResult, [
    {
      type: EventType.createEntity,
      createdAt,
      createdBy: '',
      entities: [{ id, name, version, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
    {
      type: EventType.archiveEntity,
      createdAt: archiveUpdatedAt,
      createdBy: '',
      entities: [{ id, name, version, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
    {
      type: EventType.unarchiveEntity,
      createdAt: unarchiveUpdatedAt,
      createdBy: '',
      entities: [{ id, name, version, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
  ]);
}

async function unarchiveEntity_previouslyPublished({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const { entity } = (
    await client.createEntity(TITLE_ONLY_CREATE, { publish: true })
  ).valueOrThrow();
  const reference = { id: entity.id };

  // Need to unpublish entity so we can archive it
  assertOkResult(await client.unpublishEntities([reference]));

  assertOkResult(await client.archiveEntity(reference));

  const unarchiveResult = await client.unarchiveEntity(reference);
  const { updatedAt } = unarchiveResult.valueOrThrow();
  assertResultValue(unarchiveResult, {
    id: reference.id,
    effect: 'unarchived',
    status: AdminEntityStatus.withdrawn, // since it's been published before
    updatedAt,
  });
}

async function unarchiveEntity_errorInvalidId({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider.adminClient().unarchiveEntity({
    id: '5b14e69f-6612-4ddb-bb42-7be273104486',
  });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function unarchiveEntity_errorWrongAuthKey({ clientProvider }: AdminEntityTestContext) {
  const createResult = await clientProvider.adminClient().createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      info: { authKey: 'subject' },
    }),
  );

  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await clientProvider.adminClient('secondary').unarchiveEntity({ id });
  assertErrorResult(getResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
}
