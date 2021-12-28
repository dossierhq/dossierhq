import { CoreTestUtils, ErrorType } from '@jonasb/datadata-core';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

const { expectErrorResult, expectOkResult } = CoreTestUtils;

export const GetEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getEntity_errorInvalidId,
  getEntity_errorInvalidVersion,
  getEntity_errorWrongAuthKey,
];

async function getEntity_errorInvalidId({ client }: AdminEntityTestContext) {
  const result = await client.getEntity({ id: '13e4c7da-616e-44a3-a039-24f96f9b17da' });
  expectErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function getEntity_errorInvalidVersion({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity({
    info: { type: 'TitleOnly', name: 'TitleOnly name', authKey: 'none' },
    fields: { title: 'Title' },
  });

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
  const createResult = await client.createEntity({
    info: { type: 'TitleOnly', name: 'Name', authKey: 'subject' },
    fields: { title: 'Title' },
  });

  if (expectOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;

    const getResult = await client.getEntity({ id, authKeys: ['none'] });
    expectErrorResult(getResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
  }
}
