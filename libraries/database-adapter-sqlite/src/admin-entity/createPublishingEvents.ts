import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityPublishingCreateEventArg,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { SqliteQueryBuilder } from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { SqliteDatabaseAdapter } from '..';
import { queryNone } from '../QueryFunctions';

export async function adminEntityPublishingCreateEvents(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  event: DatabaseAdminEntityPublishingCreateEventArg
): PromiseResult<void, ErrorType.Generic> {
  const now = Temporal.Now.instant();
  const qb = new SqliteQueryBuilder(
    'INSERT INTO entity_publishing_events (entities_id, entity_versions_id, published_by, published_at, kind) VALUES'
  );
  const subjectValue = qb.addValue(event.session.subjectInternalId);
  const publishedAtValue = qb.addValue(now.toString());
  const kindValue = qb.addValue(event.kind);
  for (const reference of event.references) {
    qb.addQuery(
      `(${qb.addValue(reference.entityInternalId as number)}, ${qb.addValue(
        'entityVersionInternalId' in reference
          ? (reference.entityVersionInternalId as number)
          : null
      )}, ${subjectValue}, ${publishedAtValue}, ${kindValue})`
    );
  }
  return await queryNone(databaseAdapter, context, qb.build());
}
