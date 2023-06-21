import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  createSqliteSqlQuery,
  type DatabaseManagementMarkEntitiesDirtyPayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { queryRun, type Database } from '../QueryFunctions.js';

export async function managementDirtyMarkEntities(
  database: Database,
  context: TransactionContext,
  entityTypes: string[],
  valueTypes: string[]
): PromiseResult<DatabaseManagementMarkEntitiesDirtyPayload, typeof ErrorType.Generic> {
  let count = 0;

  if (entityTypes.length > 0) {
    const { sql, query, addValueList } = createSqliteSqlQuery();

    sql`UPDATE entities SET dirty = dirty | 1|2 WHERE type IN ${addValueList(
      entityTypes
    )} AND (dirty & (1|2)) != (1|2)`;

    const result = await queryRun(database, context, query);
    if (result.isError()) return result;
    count += result.value;
  }

  if (valueTypes.length > 0) {
    const { sql, query, addValueList } = createSqliteSqlQuery();

    sql`UPDATE entities SET dirty = dirty | 1|2 FROM entity_latest_value_types elvt
    WHERE elvt.value_type IN ${addValueList(
      valueTypes
    )} AND elvt.entities_id = entities.id AND (entities.dirty & (1|2)) != (1|2)`;

    const result = await queryRun(database, context, query);
    if (result.isError()) return result;
    count += result.value;
  }

  return ok({ count });
}
