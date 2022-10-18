import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk } from '@jonasb/datadata-core';
import type {
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { buildSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import { EntitiesUniqueIndexValueConstraint } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNone } from '../QueryFunctions.js';

export async function adminEntityUniqueIndexUpsertValues(
  database: Database,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  values: Map<string, string[]>,
  options: {
    setLatest: boolean;
    setPublished: boolean;
  }
): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  const trueCount = ((options.setLatest ? 1 : 0) + (options.setPublished ? 1 : 0)) as 0 | 1 | 2;
  if (trueCount === 0) {
    return notOk.Generic('At least one of setLatest or setPublished must be true');
  }

  const query = buildSqliteSqlQuery(({ sql, addValue }) => {
    sql`INSERT INTO entity_unique_indexes (entities_id, index_name, value`;
    if (options.setLatest) sql`latest`;
    if (options.setPublished) sql`published`;
    sql`) VALUES`;

    const entityId = addValue(entity.entityInternalId as number);
    for (const [indexName, indexValues] of values) {
      for (const value of indexValues) {
        if (trueCount === 1) {
          sql`(${entityId}, ${addValue(indexName)}, ${value}, true)`;
        } else {
          sql`(${entityId}, ${addValue(indexName)}, ${value}, true, true)`;
        }
      }
    }
  });

  return queryNone(database, context, query, (error) => {
    if (database.adapter.isUniqueViolationOfConstraint(error, EntitiesUniqueIndexValueConstraint)) {
      return notOk.Conflict('Conflict with unique index value');
    }
    return notOk.GenericUnexpectedException(context, error);
  });
}
