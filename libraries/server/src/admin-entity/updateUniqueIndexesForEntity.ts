import type { PromiseResult } from '@dossierhq/core';
import { ErrorType, notOk, ok, visitorPathToString } from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseAdminEntityUniqueIndexReference,
  DatabaseAdminEntityUniqueIndexValue,
  DatabaseResolvedEntityReference,
} from '@dossierhq/database-adapter';
import type { SessionContext } from '../Context.js';
import type { UniqueIndexValue } from '../EntityCodec.js';

export async function updateUniqueIndexesForEntity(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: DatabaseResolvedEntityReference,
  isCreation: boolean,
  latestUniqueIndexValues: Map<string, UniqueIndexValue[]> | null,
  publishedUniqueIndexValues: Map<string, UniqueIndexValue[]> | null
): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const existingResult = isCreation
    ? ok([])
    : await databaseAdapter.adminEntityUniqueIndexGetValues(context, entity);
  if (existingResult.isError()) return existingResult;
  const existingValues = existingResult.value;

  // Calculate the target state
  const targetValues = calculateTargetValues(
    existingValues,
    latestUniqueIndexValues,
    publishedUniqueIndexValues
  );

  //
  const valuesToAdd: DatabaseAdminEntityUniqueIndexValue[] = [];
  const valuesToUpdate: DatabaseAdminEntityUniqueIndexValue[] = [];

  for (const [indexName, values] of targetValues) {
    for (const [value, { latest, published }] of values) {
      const existingValue = existingValues.find(
        (it) => it.index === indexName && it.value === value
      );
      if (existingValue) {
        if (existingValue.latest === latest && existingValue.published === published) {
          // do nothing since unchanged
        } else {
          valuesToUpdate.push({ index: indexName, value: value, latest, published });
        }
      } else {
        valuesToAdd.push({ index: indexName, value, latest, published });
      }
    }
  }

  const valuesToRemove: DatabaseAdminEntityUniqueIndexReference[] = [];
  for (const existingValue of existingResult.value) {
    const indexValues = targetValues.get(existingValue.index);
    if (indexValues && indexValues.has(existingValue.value)) {
      continue;
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
    if (latestUniqueIndexValues?.size === 1) {
      const indexName = latestUniqueIndexValues.keys().next().value;
      const indexValues = latestUniqueIndexValues.get(indexName);
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

function calculateTargetValues(
  existingValues: DatabaseAdminEntityUniqueIndexValue[],
  latestUniqueIndexValues: Map<string, UniqueIndexValue[]> | null,
  publishedUniqueIndexValues: Map<string, UniqueIndexValue[]> | null
) {
  const targetValues: Map<string, Map<string, { latest: boolean; published: boolean }>> = new Map();
  const getIndexValues = (indexName: string) => {
    let indexValues = targetValues.get(indexName);
    if (!indexValues) {
      indexValues = new Map();
      targetValues.set(indexName, indexValues);
    }
    return indexValues;
  };
  const addPublishedValue = (
    targetIndexValues: Map<string, { latest: boolean; published: boolean }>,
    value: string
  ) => {
    const targetValue = targetIndexValues.get(value);
    if (targetValue) {
      targetValue.published = true;
    } else {
      targetIndexValues.set(value, { latest: false, published: true });
    }
  };

  if (latestUniqueIndexValues) {
    for (const [indexName, values] of latestUniqueIndexValues) {
      const targetIndexValues = new Map<string, { latest: boolean; published: boolean }>();
      for (const value of values) {
        targetIndexValues.set(value.value, { latest: true, published: false });
      }
      targetValues.set(indexName, targetIndexValues);
    }
  } else {
    for (const existingValue of existingValues) {
      if (existingValue.latest) {
        const targetIndexValues = targetValues.get(existingValue.index);
        if (targetIndexValues) {
          targetIndexValues.set(existingValue.value, { latest: true, published: false });
        } else {
          targetValues.set(
            existingValue.index,
            new Map([[existingValue.value, { latest: true, published: false }]])
          );
        }
      }
    }
  }

  if (publishedUniqueIndexValues) {
    for (const [indexName, values] of publishedUniqueIndexValues) {
      const targetIndexValues = getIndexValues(indexName);
      for (const value of values) {
        addPublishedValue(targetIndexValues, value.value);
      }
    }
  } else {
    for (const existingValue of existingValues) {
      if (existingValue.published) {
        const targetIndexValues = getIndexValues(existingValue.index);
        addPublishedValue(targetIndexValues, existingValue.value);
      }
    }
  }

  return targetValues;
}
