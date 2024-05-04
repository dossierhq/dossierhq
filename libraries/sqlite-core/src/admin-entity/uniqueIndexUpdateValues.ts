import { ErrorType, notOk, ok, type PromiseResult } from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type DatabaseAdminEntityUniqueIndexArg,
  type DatabaseAdminEntityUniqueIndexPayload,
  type DatabaseAdminEntityUniqueIndexValue,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { UniqueIndexValueConstraint, type UniqueIndexValuesTable } from '../DatabaseSchema.js';
import { queryOne, queryRun, type Database } from '../QueryFunctions.js';

export async function adminEntityUniqueIndexUpdateValues(
  database: Database,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  values: DatabaseAdminEntityUniqueIndexArg,
): PromiseResult<DatabaseAdminEntityUniqueIndexPayload, typeof ErrorType.Generic> {
  const conflictingValues: DatabaseAdminEntityUniqueIndexValue[] = [];
  if (values.add.length > 0) {
    const addResult = await addValues(database, context, entity, values);
    if (addResult.isError()) return addResult;
    conflictingValues.push(...addResult.value);
  }
  if (values.update.length > 0) {
    const updateResult = await updateValues(database, context, entity, values);
    if (updateResult.isError()) return updateResult;
  }
  if (values.remove.length > 0) {
    const removeResult = await removeValues(database, context, values);
    if (removeResult.isError()) return removeResult;
  }

  return ok({ conflictingValues });
}

async function addValues(
  database: Database,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  values: DatabaseAdminEntityUniqueIndexArg,
): PromiseResult<DatabaseAdminEntityUniqueIndexValue[], typeof ErrorType.Generic> {
  function errorConverter(error: unknown) {
    if (database.adapter.isUniqueViolationOfConstraint(error, UniqueIndexValueConstraint)) {
      return notOk.Conflict('Conflict with unique index value');
    }
    return notOk.GenericUnexpectedException(context, error);
  }

  async function addValues(valuesToAdd: DatabaseAdminEntityUniqueIndexValue[]) {
    return context.withTransaction(async (context) => {
      const query = buildSqliteSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO unique_index_values (entities_id, index_name, value, latest, published) VALUES`;
        const entityId = addValue(entity.entityInternalId as number);
        const trueValue = addValue(1);
        const falseValue = addValue(0);

        for (const { index, value, latest, published } of valuesToAdd) {
          sql`, (${entityId}, ${index}, ${value}, ${latest ? trueValue : falseValue}, ${
            published ? trueValue : falseValue
          })`;
        }
      });

      return await queryRun(database, context, query, errorConverter);
    });
  }

  const failedValues: DatabaseAdminEntityUniqueIndexValue[] = [];

  // first try to add all values
  const addAllResult = await addValues(values.add);
  if (addAllResult.isError()) {
    if (addAllResult.isErrorType(ErrorType.Generic)) {
      return notOk.Generic(addAllResult.message);
    }
    if (values.add.length === 1) {
      failedValues.push(values.add[0]);
    } else {
      // add one by one to set as many as possible
      for (const value of values.add) {
        const addOneResult = await addValues([value]);
        if (addOneResult.isError() && addOneResult.isErrorType(ErrorType.Generic)) {
          return notOk.Generic(addOneResult.message);
        }
        failedValues.push(value);
      }
    }
  }

  return ok(failedValues);
}

async function updateValues(
  database: Database,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  values: DatabaseAdminEntityUniqueIndexArg,
): PromiseResult<void, typeof ErrorType.Generic> {
  for (const { index, value, latest, published } of values.update) {
    const result = await queryOne<Pick<UniqueIndexValuesTable, 'entities_id'>>(
      database,
      context,
      buildSqliteSqlQuery(({ sql }) => {
        sql`UPDATE unique_index_values SET latest = ${latest ? 1 : 0}, published = ${
          published ? 1 : 0
        } WHERE index_name = ${index} AND value = ${value} RETURNING entities_id`;
      }),
    );
    if (result.isError()) return result;
    if (result.value.entities_id !== entity.entityInternalId) {
      return notOk.Generic('Conflict with unique index value');
    }
  }
  return ok(undefined);
}

async function removeValues(
  database: Database,
  context: TransactionContext,
  values: DatabaseAdminEntityUniqueIndexArg,
): PromiseResult<void, typeof ErrorType.Generic> {
  for (const { index, value } of values.remove) {
    //TODO include entity id?
    const result = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql }) => {
        sql`DELETE FROM unique_index_values WHERE index_name = ${index} AND value = ${value}`;
      }),
    );
    if (result.isError()) return result;
  }
  return ok(undefined);
}
