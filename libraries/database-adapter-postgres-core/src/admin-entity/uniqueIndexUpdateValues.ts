import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityUniqueIndexArg,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';

export async function adminEntityUniqueIndexUpdateValues(
  _databaseAdapter: PostgresDatabaseAdapter,
  _context: TransactionContext,
  _entity: DatabaseResolvedEntityReference,
  _values: DatabaseAdminEntityUniqueIndexArg
): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  return notOk.Generic('Not implemented');
  /*
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
  */
}

/*
async function addValues(
  database: Database,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  values: DatabaseAdminEntityUniqueIndexArg
): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  const query = buildSqliteSqlQuery(({ sql, addValue }) => {
    sql`INSERT INTO entity_unique_indexes (entities_id, index_name, value, latest, published) VALUES`;
    const entityId = addValue(entity.entityInternalId as number);
    const trueValue = addValue(1);
    const falseValue = addValue(0);

    for (const { index, value, latest, published } of values.add) {
      sql`(${entityId}, ${index}, ${value}, ${latest ? trueValue : falseValue}, ${
        published ? trueValue : falseValue
      })`;
    }
  });

  return queryNone(database, context, query, (error) => {
    if (database.adapter.isUniqueViolationOfConstraint(error, EntitiesUniqueIndexValueConstraint)) {
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
  const query = buildSqliteSqlQuery(({ sql, addValue }) => {
    sql`INSERT INTO entity_unique_indexes (index_name, value, latest, published) VALUES`;
    const trueValue = addValue(1);
    const falseValue = addValue(0);

    for (const { index, value, latest, published } of values.add) {
      sql`(${index}, ${value}, ${latest ? trueValue : falseValue}, ${
        published ? trueValue : falseValue
      })`;
    }
    sql`ON CONFLICT (index_name, value) DO UPDATE SET latest = excluded.latest, published = excluded.published`;
    sql`RETURNING entities_id`;
  });

  const updateResult = await queryMany<Pick<EntityUniqueIndexesTable, 'entities_id'>>(
    database,
    context,
    query
  );
  if (updateResult.isError()) return updateResult;

  for (const { entities_id } of updateResult.value) {
    if (entities_id !== entity.entityInternalId) {
      return notOk.Generic(
        `Updated value of another entity (got: ${entities_id} expected: ${entity.entityInternalId})`
      );
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
    const result = await queryNone(
      database,
      context,
      buildSqliteSqlQuery(({ sql }) => {
        sql`DELETE FROM entity_unique_indexes WHERE index_name = ${index} AND value = ${value}`;
      })
    );
    if (result.isError()) return result;
  }
  return ok(undefined);
}
*/
