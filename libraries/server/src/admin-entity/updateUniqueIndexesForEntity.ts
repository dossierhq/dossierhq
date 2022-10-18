import type { PromiseResult } from '@jonasb/datadata-core';
import { ErrorType, notOk, ok, visitorPathToString } from '@jonasb/datadata-core';
import type {
  DatabaseAdapter,
  DatabaseResolvedEntityReference,
} from '@jonasb/datadata-database-adapter';
import type { SessionContext } from '../Context.js';
import type { UniqueIndexValue } from '../EntityCodec.js';

export async function updateUniqueIndexesForEntity(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: DatabaseResolvedEntityReference,
  uniqueIndexValues: Map<string, UniqueIndexValue[]>,
  publish: boolean
): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  if (uniqueIndexValues.size === 0) {
    return ok(undefined);
  }

  const valuesWithoutPath = new Map<string, string[]>();
  for (const [indexName, values] of uniqueIndexValues) {
    valuesWithoutPath.set(
      indexName,
      values.map((it) => it.value)
    );
  }
  const result = await databaseAdapter.adminEntityUniqueIndexUpsertValues(
    context,
    entity,
    valuesWithoutPath,
    {
      setLatest: true,
      setPublished: publish,
    }
  );

  if (result.isError() && result.isErrorType(ErrorType.Conflict)) {
    //TODO handle resolving error messages when there are multiple unique values
    if (uniqueIndexValues.size === 1) {
      const indexName = uniqueIndexValues.keys().next().value;
      const indexValues = uniqueIndexValues.get(indexName);
      if (indexValues?.length === 1) {
        const value = indexValues[0];
        return notOk.Conflict(
          `${visitorPathToString(value.path)}: Value is not unique (index: ${indexName})`
        );
      }
    }
  }
  return result;
}
