import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityUniqueIndexArg,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { buildSqliteSqlQuery } from '@dossierhq/database-adapter';
import type { UniqueIndexValuesTable } from '../DatabaseSchema.js';
import { UniqueIndexValueConstraint } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryOne, queryRun } from '../QueryFunctions.js';

export async function adminEntityUniqueIndexUpdateValues(
  database: Database,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  values: DatabaseAdminEntityUniqueIndexArg
): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  if (values.add.length > 0) {
    const addResult = await addValues(database, context, entity, values);
    if (addResult.isError()) return addResult;
  }
  if (values.update.length > 0) {
    const updateResult = await updateValues(database, context, entity, values);
    if (updateResult.isError()) return updateResult;
  }
  if (values.remove.length > 0) {
    const removeResult = await removeValues(database, context, values);
    if (removeResult.isError()) return removeResult;
  }

  return ok(undefined);
}

async function addValues(
  database: Database,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  values: DatabaseAdminEntityUniqueIndexArg
): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  const query = buildSqliteSqlQuery(({ sql, addValue }) => {
    sql`INSERT INTO unique_index_values (entities_id, index_name, value, latest, published) VALUES`;
    const entityId = addValue(entity.entityInternalId as number);
    const trueValue = addValue(1);
    const falseValue = addValue(0);

    for (const { index, value, latest, published } of values.add) {
      sql`(${entityId}, ${index}, ${value}, ${latest ? trueValue : falseValue}, ${
        published ? trueValue : falseValue
      })`;
    }
  });

  return queryRun(database, context, query, (error) => {
    if (database.adapter.isUniqueViolationOfConstraint(error, UniqueIndexValueConstraint)) {
      return notOk.Conflict('Conflict with unique index value');
    }
    return notOk.GenericUnexpectedException(context, error);
  });
}

async function updateValues(
  database: Database,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  values: DatabaseAdminEntityUniqueIndexArg
): PromiseResult<void, typeof ErrorType.Generic> {
  for (const { index, value, latest, published } of values.update) {
    const result = await queryOne<Pick<UniqueIndexValuesTable, 'entities_id'>>(
      database,
      context,
      buildSqliteSqlQuery(({ sql }) => {
        sql`UPDATE unique_index_values SET latest = ${latest ? 1 : 0}, published = ${
          published ? 1 : 0
        } WHERE index_name = ${index} AND value = ${value} RETURNING entities_id`;
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
  database: Database,
  context: TransactionContext,
  values: DatabaseAdminEntityUniqueIndexArg
): PromiseResult<void, typeof ErrorType.Generic> {
  for (const { index, value } of values.remove) {
    //TODO include entity id?
    const result = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql }) => {
        sql`DELETE FROM unique_index_values WHERE index_name = ${index} AND value = ${value}`;
      })
    );
    if (result.isError()) return result;
  }
  return ok(undefined);
}
