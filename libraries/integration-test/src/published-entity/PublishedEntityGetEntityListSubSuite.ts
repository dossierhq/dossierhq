import { Schema, notOk, ok, type ErrorType } from '@dossierhq/core';
import { assertEquals, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AppPublishedEntity } from '../SchemaTypes.js';
import {
  SUBJECT_ONLY_CREATE,
  TITLE_ONLY_CREATE,
  adminToPublishedEntity,
} from '../shared-entity/Fixtures.js';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite.js';

export const GetEntityListSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  getEntityList_minimal,
  getEntityList_none,
  getEntityList_authKeySubjectOneCorrectOneWrong,
  getEntityList_oneMissingOneExisting,
  getEntityList_errorArchivedEntity,
  getEntityList_errorWrongAuthKeyFromReadonlyRandom,
];

async function getEntityList_minimal({ clientProvider }: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const adminSchema = new Schema((await adminClient.getSchemaSpecification()).valueOrThrow());

  const create1Result = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  const create2Result = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(create1Result);
  assertOkResult(create2Result);
  const {
    entity: { id: id1 },
  } = create1Result.value;
  const {
    entity: { id: id2 },
  } = create2Result.value;

  const getResult = await publishedClient.getEntityList([{ id: id1 }, { id: id2 }]);
  assertOkResult(getResult);
  const [get1Result, get2Result] = getResult.value;
  assertOkResult(get1Result);
  assertOkResult(get2Result);
  assertEquals(get1Result.value, adminToPublishedEntity(adminSchema, create1Result.value.entity));
  assertEquals(get2Result.value, adminToPublishedEntity(adminSchema, create2Result.value.entity));
}

async function getEntityList_none({ clientProvider }: PublishedEntityTestContext) {
  const result = await clientProvider.publishedClient().getEntityList([]);
  assertResultValue(result, []);
}

async function getEntityList_authKeySubjectOneCorrectOneWrong({
  clientProvider,
}: PublishedEntityTestContext) {
  const primaryAdminClient = clientProvider.adminClient();
  const adminSchema = new Schema(
    (await primaryAdminClient.getSchemaSpecification()).valueOrThrow(),
  );

  const create1Result = await clientProvider
    .adminClient('secondary')
    .createEntity(SUBJECT_ONLY_CREATE, { publish: true });
  const create2Result = await primaryAdminClient.createEntity(SUBJECT_ONLY_CREATE, {
    publish: true,
  });
  assertOkResult(create1Result);
  assertOkResult(create2Result);
  const {
    entity: { id: id1 },
  } = create1Result.value;
  const {
    entity: { id: id2 },
  } = create2Result.value;

  const getResult = await clientProvider
    .publishedClient()
    .getEntityList([{ id: id1 }, { id: id2 }]);
  assertResultValue(getResult, [
    notOk.NotAuthorized('Wrong authKey provided'),
    ok<AppPublishedEntity, typeof ErrorType.Generic>(
      adminToPublishedEntity(adminSchema, create2Result.value.entity),
    ),
  ]);
}

async function getEntityList_oneMissingOneExisting({ clientProvider }: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const adminSchema = new Schema((await adminClient.getSchemaSpecification()).valueOrThrow());
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  const { entity } = createResult.valueOrThrow();

  const getResult = await clientProvider
    .publishedClient()
    .getEntityList([{ id: 'f09fdd62-4a1e-4320-afba-8dd0781799df' }, { id: entity.id }]);
  assertResultValue(getResult, [
    notOk.NotFound('No such entity'),
    ok<AppPublishedEntity, typeof ErrorType.Generic>(adminToPublishedEntity(adminSchema, entity)),
  ]);
}

async function getEntityList_errorArchivedEntity({ clientProvider }: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const archiveResult = await adminClient.archiveEntity({ id });
  assertOkResult(archiveResult);

  const result = await publishedClient.getEntityList([{ id }]);
  assertResultValue(result, [notOk.NotFound('No such entity')]);
}

async function getEntityList_errorWrongAuthKeyFromReadonlyRandom({
  clientProvider,
}: PublishedEntityTestContext) {
  const primaryAdminClient = clientProvider.adminClient();

  const { entity } = (
    await primaryAdminClient.createEntity(SUBJECT_ONLY_CREATE, { publish: true })
  ).valueOrThrow();

  const getResult = await clientProvider
    .publishedClient('random', 'readonly')
    .getEntityList([{ id: entity.id }]);
  assertResultValue(getResult, [notOk.NotAuthorized('Wrong authKey provided')]);
}
