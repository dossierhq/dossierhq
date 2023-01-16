import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityUniqueIndexArg,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { buildPostgresSqlQuery } from '@jonasb/datadata-database-adapter';
import type { UniqueIndexValuesTable } from '../DatabaseSchema.js';
import { UniqueConstraints } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone, queryOne } from '../QueryFunctions.js';

export async function adminEntityUniqueIndexUpdateValues(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  values: DatabaseAdminEntityUniqueIndexArg
): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  if (values.add.length > 0) {
    const addResult = await addValues(databaseAdapter, context, entity, values);
    if (addResult.isError()) return addResult;
  }
  if (values.update.length > 0) {
    const updateResult = await updateValues(databaseAdapter, context, entity, values);
    if (updateResult.isError()) return updateResult;
  }
  if (values.remove.length > 0) {
    const removeResult = await removeValues(databaseAdapter, context, values);
    if (removeResult.isError()) return removeResult;
  }

  return ok(undefined);
}

async function addValues(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  values: DatabaseAdminEntityUniqueIndexArg
): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  const query = buildPostgresSqlQuery(({ sql, addValue }) => {
    sql`INSERT INTO unique_index_values (entities_id, index_name, value, latest, published) VALUES`;
    const entityId = addValue(entity.entityInternalId as number);
    const trueValue = addValue(true);
    const falseValue = addValue(false);

    for (const { index, value, latest, published } of values.add) {
      sql`(${entityId}, ${index}, ${value}, ${latest ? trueValue : falseValue}, ${
        published ? trueValue : falseValue
      })`;
    }
  });

  return queryNone(databaseAdapter, context, query, (error) => {
    if (
      databaseAdapter.isUniqueViolationOfConstraint(
        error,
        UniqueConstraints.unique_index_values_index_name_value_key
      )
    ) {
      return notOk.Conflict('Conflict with unique index value');
    }
    return notOk.GenericUnexpectedException(context, error);
  });
}

async function updateValues(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  values: DatabaseAdminEntityUniqueIndexArg
): PromiseResult<void, typeof ErrorType.Generic> {
  for (const { index, value, latest, published } of values.update) {
    const result = await queryOne<Pick<UniqueIndexValuesTable, 'entities_id'>>(
      databaseAdapter,
      context,
      buildPostgresSqlQuery(({ sql }) => {
        sql`UPDATE unique_index_values SET latest = ${latest}, published = ${published} WHERE index_name = ${index} AND value = ${value} RETURNING entities_id`;
      })
    );
    if (result.isError()) return result;
    if (result.value.entities_id !== entity.entityInternalId) {
      return notOk.Generic('Conflict with unique index value');
    }
  }
  return ok(undefined);
}

async function removeValues(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  values: DatabaseAdminEntityUniqueIndexArg
): PromiseResult<void, typeof ErrorType.Generic> {
  for (const { index, value } of values.remove) {
    //TODO include entity id?
    const result = await queryNone(
      databaseAdapter,
      context,
      buildPostgresSqlQuery(({ sql }) => {
        sql`DELETE FROM unique_index_values WHERE index_name = ${index} AND value = ${value}`;
      })
    );
    if (result.isError()) return result;
  }
  return ok(undefined);
}
