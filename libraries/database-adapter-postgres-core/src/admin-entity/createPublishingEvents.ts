import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityPublishingCreateEventArg,
  TransactionContext,
} from '@jonasb/datadata-server';
import { QueryBuilder } from '@jonasb/datadata-server';
import type { PostgresDatabaseAdapter } from '..';
import { queryNone } from '../QueryFunctions';

export async function adminEntityPublishingCreateEvents(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  event: DatabaseAdminEntityPublishingCreateEventArg
): PromiseResult<void, ErrorType.Generic> {
  const qb = new QueryBuilder(
    'INSERT INTO entity_publishing_events (entities_id, entity_versions_id, published_by, kind) VALUES'
  );
  const subjectValue = qb.addValue(event.session.subjectInternalId);
  const kindValue = qb.addValue(event.kind);
  for (const reference of event.references) {
    qb.addQuery(
      `(${qb.addValue(reference.entityInternalId)}, ${qb.addValue(
        reference.entityVersionInternalId
      )}, ${subjectValue}, ${kindValue})`
    );
  }
  return await queryNone(databaseAdapter, context, qb.build());
}
