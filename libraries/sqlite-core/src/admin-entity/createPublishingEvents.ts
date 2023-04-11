import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type {
  DatabaseAdminEntityPublishingCreateEventArg,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { createSqliteSqlQuery } from '@dossierhq/database-adapter';
import type { Database } from '../QueryFunctions.js';
import { queryRun } from '../QueryFunctions.js';
import { getSessionSubjectInternalId } from '../utils/SessionUtils.js';

export async function adminEntityPublishingCreateEvents(
  database: Database,
  context: TransactionContext,
  event: DatabaseAdminEntityPublishingCreateEventArg
): PromiseResult<void, typeof ErrorType.Generic> {
  const now = new Date();

  const { addValue, query, sql } = createSqliteSqlQuery();
  sql`INSERT INTO entity_publishing_events (entities_id, entity_versions_id, published_by, published_at, kind) VALUES`;

  const subjectValue = addValue(getSessionSubjectInternalId(event.session));
  const publishedAtValue = addValue(now.toISOString());
  const kindValue = addValue(event.kind);

  for (const reference of event.references) {
    const entitiesId = reference.entityInternalId as number;
    const entityVersionId =
      'entityVersionInternalId' in reference ? (reference.entityVersionInternalId as number) : null;
    sql`(${entitiesId}, ${entityVersionId}, ${subjectValue}, ${publishedAtValue}, ${kindValue})`;
  }
  const result = await queryRun(database, context, query);
  return result.isOk() ? ok(undefined) : result;
}
