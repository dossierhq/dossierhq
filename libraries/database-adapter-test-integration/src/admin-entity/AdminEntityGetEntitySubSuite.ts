import { copyEntity, CoreTestUtils, ErrorType } from '@jonasb/datadata-core';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE } from './Fixtures';

const { expectErrorResult, expectResultValue, expectOkResult } = CoreTestUtils;

export const GetEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getEntity_withSubjectAuthKey,
  getEntity_errorInvalidId,
  getEntity_errorInvalidVersion,
  getEntity_errorWrongAuthKey,
];

async function getEntity_withSubjectAuthKey({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  if (expectOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;

    const getResult = await client.getEntity({ id, authKeys: ['subject'] });
    expectResultValue(getResult, createResult.value.entity);
  }
}

async function getEntity_errorInvalidId({ client }: AdminEntityTestContext) {
  const result = await client.getEntity({ id: '13e4c7da-616e-44a3-a039-24f96f9b17da' });
  expectErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function getEntity_errorInvalidVersion({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);

  if (expectOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;

    const resultMinusOne = await client.getEntity({ id, version: -1 });
    expectErrorResult(resultMinusOne, ErrorType.NotFound, 'No such entity or version');

    const resultOne = await client.getEntity({ id, version: 1 });
    expectErrorResult(resultOne, ErrorType.NotFound, 'No such entity or version');
  }
}

async function getEntity_errorWrongAuthKey({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      info: { authKey: 'subject' },
    })
  );

  if (expectOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;

    const getResult = await client.getEntity({ id, authKeys: ['none'] });
    expectErrorResult(getResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
  }
}
