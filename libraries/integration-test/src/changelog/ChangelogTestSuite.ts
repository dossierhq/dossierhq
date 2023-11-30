import type { Server } from '@dossierhq/server';
import { assertSame } from '../Asserts.js';
import { buildSuite } from '../Builder.js';
import type { TestFunctionInitializer, TestSuite } from '../index.js';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients.js';

interface ChangelogTestContext {
  server: Server;
}

export function createChangelogTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<ChangelogTestContext, TCleanup>,
): TestSuite {
  return buildSuite(initializer, getChangelogEventsTotalCount_resultIsNumber);
}

async function getChangelogEventsTotalCount_resultIsNumber({ server }: ChangelogTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const result = await adminClient.getChangelogEventsTotalCount();
  const count = result.valueOrThrow();
  assertSame(typeof count, 'number');
}
