import type { AdminEntityHistory } from '../src';

export const uuidMatcher = /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/;

export function expectEntityHistoryVersions(
  actual: AdminEntityHistory,
  expectedVersions: Omit<AdminEntityHistory['versions'][0], 'createdAt'>[]
): void {
  // Skip createdAt since dates are unpredictable
  const actualVersions = actual.versions.map((x) => {
    const { createdAt: unusedCreatedAt, ...version } = x;
    return version;
  });
  expect(actualVersions).toEqual(expectedVersions);
}
