import type {
  AdminEntity2,
  Connection,
  Edge,
  EntityHistory,
  ErrorType,
  Result,
} from '@datadata/core';
import { assertIsDefined, CoreTestUtils } from '@datadata/core';
import { v4 as uuidv4 } from 'uuid';

const { expectOkResult } = CoreTestUtils;

export function expectResultValue<TOk, TError extends ErrorType>(
  result: Result<TOk, TError>,
  expectedValue: TOk
): void {
  if (expectOkResult(result)) {
    expect(result.value).toEqual<TOk>(expectedValue);
  }
}

export function expectEntityHistoryVersions(
  actual: EntityHistory,
  expectedVersions: Omit<EntityHistory['versions'][0], 'createdAt'>[]
): void {
  // Skip createdAt since dates are unpredictable
  const actualVersions = actual.versions.map((x) => {
    const { createdAt: _createdAt, ...version } = x;
    return version;
  });
  expect(actualVersions).toEqual(expectedVersions);
}

export function expectSearchResultEntities(
  result: Result<Connection<Edge<AdminEntity2, ErrorType>> | null, ErrorType.BadRequest>,
  actualEntities: AdminEntity2[]
): void {
  if (expectOkResult(result)) {
    assertIsDefined(result.value);
    expect(result.value.edges).toHaveLength(actualEntities.length);
    for (const [index, actualEntity] of actualEntities.entries()) {
      expectResultValue(result.value.edges[index].node, actualEntity);
    }
  }
}

/** N.B. This is insecure but needed since the default uuidv4() results in open handle for tests */
export function insecureTestUuidv4(): string {
  const random = new Uint8Array(16);

  for (let i = 0; i < random.length; i++) {
    random[i] = Math.floor(Math.random() * 255);
  }
  return uuidv4({
    random,
  });
}
