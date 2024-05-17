import { assertOkResult, ErrorType } from '@dossierhq/core';
import { assertErrorResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import { SUBJECT_ONLY_CREATE, TITLE_ONLY_CREATE } from '../shared-entity/Fixtures.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const DeleteEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  deleteEntity_minimal,
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
