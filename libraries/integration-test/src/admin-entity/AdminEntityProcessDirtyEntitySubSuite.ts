import { ErrorType } from '@dossierhq/core';
import { assertErrorResult } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const ProcessDirtyEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  processDirtyEntity_errorReadonlySession,
];

//TODO add some more tests

async function processDirtyEntity_errorReadonlySession({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient('main', 'readonly');
  const result = await adminClient.processDirtyEntity({ id: 'test' });
  assertErrorResult(result, ErrorType.BadRequest, 'Readonly session used to process dirty entity');
}
