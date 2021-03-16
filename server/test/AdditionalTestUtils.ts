import type { AdminEntityHistory } from '@datadata/core';

export function expectEntityHistoryVersions(
  actual: AdminEntityHistory,
  expectedVersions: Omit<AdminEntityHistory['versions'][0], 'createdAt'>[]
): void {
  // Skip createdAt since dates are unpredictable
  const actualVersions = actual.versions.map((x) => {
    const { createdAt: _createdAt, ...version } = x;
    return version;
  });
  expect(actualVersions).toEqual(expectedVersions);
}
