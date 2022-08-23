import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { buildSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import type { Database } from '../QueryFunctions.js';
import { queryNone } from '../QueryFunctions.js';

export async function updateEntityLatestReferencesIndex(
  database: Database,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  referenceIds: DatabaseResolvedEntityReference[],
  { skipDelete }: { skipDelete: boolean }
): PromiseResult<void, typeof ErrorType.Generic> {
  if (!skipDelete) {
    const removeExistingReferencesResult = await queryNone(
      database,
      context,
      buildSqliteSqlQuery(
        ({ sql }) =>
          sql`DELETE FROM entity_latest_references WHERE from_entities_id = ${
            entity.entityInternalId as number
          }`
      )
    );
    if (removeExistingReferencesResult.isError()) return removeExistingReferencesResult;
  }

  if (referenceIds.length > 0) {
    const insertReferencesResult = await queryNone(
      database,
      context,
      buildSqliteSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO entity_latest_references (from_entities_id, to_entities_id) VALUES`;
        const fromEntitiesId = addValue(entity.entityInternalId as number);
        for (const referenceId of referenceIds) {
          sql`(${fromEntitiesId}, ${referenceId.entityInternalId as number})`;
        }
      })
    );
    if (insertReferencesResult.isError()) return insertReferencesResult;
  }

  return ok(undefined);
}
