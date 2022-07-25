import { AdminEntityStatus, copyEntity, ErrorType } from '@jonasb/datadata-core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures.js';
import {
  adminClientForMainPrincipal,
  adminClientForSecondaryPrincipal,
} from '../shared-entity/TestClients.js';

export const ArchiveEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  archiveEntity_minimal,
  archiveEntity_errorInvalidError,
  archiveEntity_errorWrongAuthKey,
  archiveEntity_errorPublishedEntity,
];

async function archiveEntity_minimal({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const archiveResult = await client.archiveEntity({ id });
  assertOkResult(archiveResult);
  const { updatedAt } = archiveResult.value;
  assertResultValue(archiveResult, {
    id,
    effect: 'archived',
    status: AdminEntityStatus.archived,
    updatedAt,
  });

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: { status: AdminEntityStatus.archived, updatedAt },
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function archiveEntity_errorInvalidError({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).archiveEntity({
    id: '5b14e69f-6612-4ddb-bb42-7be273104486',
  });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function archiveEntity_errorWrongAuthKey({ server }: AdminEntityTestContext) {
  const createResult = await adminClientForMainPrincipal(server).createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      info: { authKey: 'subject' },
    })
  );

  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await adminClientForSecondaryPrincipal(server).archiveEntity({ id });
  assertErrorResult(getResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
}

async function archiveEntity_errorPublishedEntity({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE, {
    publish: true,
  });
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await adminClient.archiveEntity({ id });
  assertErrorResult(getResult, ErrorType.BadRequest, 'Entity is published');
}
