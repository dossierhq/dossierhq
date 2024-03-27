import { AdminEntityStatus, copyEntity, ErrorType, EventType } from '@dossierhq/core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import { assertChangelogEventsConnection } from '../shared-entity/EventsTestUtils.js';
import { SUBJECT_ONLY_CREATE, TITLE_ONLY_CREATE } from '../shared-entity/Fixtures.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const ArchiveEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  archiveEntity_minimal,
  archiveEntity_archivedEntity,
  archiveEntity_archiveEntityEvent,
  archiveEntity_errorInvalidError,
  archiveEntity_errorWrongAuthKey,
  archiveEntity_errorPublishedEntity,
  archiveEntity_errorReadonlySession,
];

async function archiveEntity_minimal({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  const { entity } = createResult.valueOrThrow();

  const archiveResult = await adminClient.archiveEntity({ id: entity.id });
  const { updatedAt } = archiveResult.valueOrThrow();
  assertResultValue(archiveResult, {
    id: entity.id,
    effect: 'archived',
    status: AdminEntityStatus.archived,
    updatedAt,
  });

  const expectedEntity = copyEntity(entity, {
    info: { status: AdminEntityStatus.archived, updatedAt },
  });

  const getResult = await adminClient.getEntity({ id: entity.id });
  assertResultValue(getResult, expectedEntity);
}

async function archiveEntity_archivedEntity({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  const { entity } = createResult.valueOrThrow();

  const firstArchiveResult = await adminClient.archiveEntity({ id: entity.id });
  const { updatedAt } = firstArchiveResult.valueOrThrow();

  const secondArchiveResult = await adminClient.archiveEntity({ id: entity.id });
  assertResultValue(secondArchiveResult, {
    id: entity.id,
    effect: 'none',
    status: AdminEntityStatus.archived,
    updatedAt,
  });

  const expectedEntity = copyEntity(entity, {
    info: { status: AdminEntityStatus.archived, updatedAt },
  });

  const getResult = await adminClient.getEntity({ id: entity.id });
  assertResultValue(getResult, expectedEntity);
}

async function archiveEntity_archiveEntityEvent({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { createdAt, name },
    },
  } = createResult.value;

  const archiveResult = await adminClient.archiveEntity({ id });
  const { updatedAt } = archiveResult.valueOrThrow();
  assertResultValue(archiveResult, {
    id,
    effect: 'archived',
    status: AdminEntityStatus.archived,
    updatedAt,
  });

  const connectionResult = await adminClient.getChangelogEvents({ entity: { id } });
  assertChangelogEventsConnection(connectionResult, [
    {
      type: EventType.createEntity,
      createdAt,
      createdBy: '',
      entities: [{ id, name, version: 1, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
    {
      type: EventType.archiveEntity,
      createdAt: updatedAt,
      createdBy: '',
      entities: [{ id, name, version: 1, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
  ]);
}

async function archiveEntity_errorInvalidError({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider.adminClient().archiveEntity({
    id: '5b14e69f-6612-4ddb-bb42-7be273104486',
  });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function archiveEntity_errorWrongAuthKey({ clientProvider }: AdminEntityTestContext) {
  const createResult = await clientProvider.adminClient().createEntity(SUBJECT_ONLY_CREATE);
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const archiveResult = await clientProvider.adminClient('secondary').archiveEntity({ id });
  assertErrorResult(archiveResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
}

async function archiveEntity_errorPublishedEntity({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE, {
    publish: true,
  });
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const archiveResult = await adminClient.archiveEntity({ id });
  assertErrorResult(archiveResult, ErrorType.BadRequest, 'Entity is published');
}

async function archiveEntity_errorReadonlySession({ clientProvider }: AdminEntityTestContext) {
  const normalAdminClient = clientProvider.adminClient('main', 'write');
  const readonlyAdminClient = clientProvider.adminClient('main', 'readonly');
  const createResult = await normalAdminClient.createEntity(TITLE_ONLY_CREATE);
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const archiveResult = await readonlyAdminClient.archiveEntity({ id });
  assertErrorResult(archiveResult, ErrorType.BadRequest, 'Readonly session used to archive entity');
}
