import type { ErrorType, PromiseResult } from '@dossierhq/core';
import type {
  DatabaseAdminEntityPublishingCreateEventArg,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { createPostgresSqlQuery } from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone } from '../QueryFunctions.js';
import { getSessionSubjectInternalId } from '../utils/SessionUtils.js';

export async function adminEntityPublishingCreateEvents(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  event: DatabaseAdminEntityPublishingCreateEventArg
): PromiseResult<void, typeof ErrorType.Generic> {
  const { addValue, query, sql } = createPostgresSqlQuery();
  sql`INSERT INTO entity_publishing_events (entities_id, entity_versions_id, published_by, kind) VALUES`;
  const subjectValue = addValue(getSessionSubjectInternalId(event.session));
  const kindValue = addValue(event.kind);
  for (const reference of event.references) {
    sql`(${reference.entityInternalId}, ${
      'entityVersionInternalId' in reference ? reference.entityVersionInternalId : null
    }, ${subjectValue}, ${kindValue})`;
  }
  return await queryNone(databaseAdapter, context, query);
}
