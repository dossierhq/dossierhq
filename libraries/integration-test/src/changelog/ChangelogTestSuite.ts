import { assertSame } from '../Asserts.js';
import { buildSuite } from '../Builder.js';
import type { DossierClientProvider, TestFunctionInitializer, TestSuite } from '../index.js';

interface ChangelogTestContext {
  clientProvider: DossierClientProvider;
}

export function createChangelogTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<ChangelogTestContext, TCleanup>,
): TestSuite {
  return buildSuite(initializer, getChangelogEventsTotalCount_resultIsNumber);
}

async function getChangelogEventsTotalCount_resultIsNumber({
  clientProvider,
}: ChangelogTestContext) {
  const client = clientProvider.dossierClient();
  const result = await client.getChangelogEventsTotalCount();
  const count = result.valueOrThrow();
  assertSame(typeof count, 'number');
}
