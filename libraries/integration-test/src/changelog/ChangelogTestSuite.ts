import { assertSame } from '../Asserts.js';
import { buildSuite } from '../Builder.js';
import type { AdminClientProvider, TestFunctionInitializer, TestSuite } from '../index.js';

interface ChangelogTestContext {
  clientProvider: AdminClientProvider;
}

export function createChangelogTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<ChangelogTestContext, TCleanup>,
): TestSuite {
  return buildSuite(initializer, getChangelogEventsTotalCount_resultIsNumber);
}

async function getChangelogEventsTotalCount_resultIsNumber({
  clientProvider,
}: ChangelogTestContext) {
  const adminClient = clientProvider.adminClient();
  const result = await adminClient.getChangelogEventsTotalCount();
  const count = result.valueOrThrow();
  assertSame(typeof count, 'number');
}
