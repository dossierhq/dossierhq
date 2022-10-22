import type { PromiseResult } from '@jonasb/datadata-core';
import { ErrorType, notOk, ok, visitorPathToString } from '@jonasb/datadata-core';
import type {
  DatabaseAdapter,
  DatabaseAdminEntityUniqueIndexReference,
  DatabaseAdminEntityUniqueIndexValue,
  DatabaseResolvedEntityReference,
} from '@jonasb/datadata-database-adapter';
import type { SessionContext } from '../Context.js';
import type { UniqueIndexValue } from '../EntityCodec.js';

export async function updateUniqueIndexesForEntity(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: DatabaseResolvedEntityReference,
  uniqueIndexValues: Map<string, UniqueIndexValue[]>,
  isCreation: boolean,
  publish: boolean
): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const existingResult = isCreation
    ? ok([])
    : await databaseAdapter.adminEntityUniqueIndexGetValues(context, entity);
  if (existingResult.isError()) return existingResult;

  const valuesToAdd: DatabaseAdminEntityUniqueIndexValue[] = [];
  const valuesToUpdate: DatabaseAdminEntityUniqueIndexValue[] = [];

  for (const [indexName, values] of uniqueIndexValues) {
    for (const value of values) {
      const existingValue = existingResult.value.find(
        (it) => it.index === indexName && it.value === value.value
      );
      if (existingValue) {
        //TODO fix when doing published properly
        if (existingValue.latest === true && existingValue.published === publish) {
          // do nothing since unchanged
        } else {
          valuesToUpdate.push({
            index: indexName,
            value: value.value,
            latest: true,
            published: publish,
          });
        }
      } else {
        valuesToAdd.push({
          index: indexName,
          value: value.value,
          latest: true,
          published: publish,
        });
      }
    }
  }

  const valuesToRemove: DatabaseAdminEntityUniqueIndexReference[] = [];
  for (const existingValue of existingResult.value) {
    const indexValues = uniqueIndexValues.get(existingValue.index);
    if (indexValues) {
      const found = indexValues.find((it) => it.value === existingValue.value);
      if (found) {
        continue;
      }
    }
    valuesToRemove.push({ index: existingValue.index, value: existingValue.value });
  }

  if (valuesToAdd.length === 0 && valuesToUpdate.length === 0 && valuesToRemove.length === 0) {
    return ok(undefined);
  }

  const result = await databaseAdapter.adminEntityUniqueIndexUpdateValues(context, entity, {
    add: valuesToAdd,
    update: valuesToUpdate,
    remove: valuesToRemove,
  });

  if (result.isError() && result.isErrorType(ErrorType.Conflict)) {
    //TODO handle resolving error messages when there are multiple unique values
    if (uniqueIndexValues.size === 1) {
      const indexName = uniqueIndexValues.keys().next().value;
      const indexValues = uniqueIndexValues.get(indexName);
      if (indexValues?.length === 1) {
        const value = indexValues[0];
        return notOk.BadRequest(
          `${visitorPathToString(value.path)}: Value is not unique (index: ${indexName})`
        );
      }
    }
    return notOk.BadRequest('Value is not unique');
  } else if (result.isError()) {
    return notOk.Generic(result.message);
  }
  return ok(undefined);
}
