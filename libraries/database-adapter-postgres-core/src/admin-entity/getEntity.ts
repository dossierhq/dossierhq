import type {
  EntityReference,
  EntityVersionReference,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { assertExhaustive, EntityPublishState, notOk, ok } from '@jonasb/datadata-core';
import type { DatabaseAdminEntityGetOnePayload, TransactionContext } from '@jonasb/datadata-server';
import type { PostgresDatabaseAdapter } from '..';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema';
import { queryNoneOrOne } from '../QueryFunctions';

export async function adminGetEntity(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference | EntityVersionReference
): PromiseResult<DatabaseAdminEntityGetOnePayload, ErrorType.NotFound | ErrorType.Generic> {
  let actualVersion: number;
  if ('version' in reference) {
    actualVersion = reference.version;
  } else {
    const versionResult = await resolveMaxVersionForEntity(databaseAdapter, context, reference.id);
    if (versionResult.isError()) {
      return versionResult;
    }
    actualVersion = versionResult.value.maxVersion;
  }
  const result = await queryNoneOrOne<
    Pick<
      EntitiesTable,
      | 'uuid'
      | 'type'
      | 'name'
      | 'auth_key'
      | 'resolved_auth_key'
      | 'created_at'
      | 'updated_at'
      | 'status'
    > &
      Pick<EntityVersionsTable, 'version' | 'data'>
  >(databaseAdapter, context, {
    text: `SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = $1
      AND e.id = ev.entities_id
      AND ev.version = $2`,
    values: [reference.id, actualVersion],
  });
  if (result.isError()) {
    return result;
  }
  if (!result.value) {
    return notOk.NotFound('No such entity or version');
  }

  const {
    uuid: id,
    type,
    name,
    version,
    auth_key: authKey,
    resolved_auth_key: resolvedAuthKey,
    status,
    created_at: createdAt,
    updated_at: updatedAt,
    data: fieldValues,
  } = result.value;

  return ok({
    id,
    type,
    name,
    version,
    authKey,
    resolvedAuthKey,
    status: resolveEntityStatus(status),
    createdAt,
    updatedAt,
    fieldValues,
  });
}

async function resolveMaxVersionForEntity(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  id: string
): PromiseResult<{ entityId: number; maxVersion: number }, ErrorType.NotFound | ErrorType.Generic> {
  const result = await queryNoneOrOne<Pick<EntityVersionsTable, 'entities_id' | 'version'>>(
    databaseAdapter,
    context,
    {
      text: `SELECT ev.entities_id, ev.version
      FROM entity_versions ev, entities e
      WHERE e.uuid = $1 AND e.latest_draft_entity_versions_id = ev.id`,
      values: [id],
    }
  );
  if (result.isError()) {
    return result;
  }
  if (!result.value) {
    return notOk.NotFound('No such entity');
  }
  const { entities_id: entityId, version: maxVersion } = result.value;
  return ok({ entityId, maxVersion });
}

export function resolveEntityStatus(status: EntitiesTable['status']): EntityPublishState {
  switch (status) {
    case 'draft':
      return EntityPublishState.Draft;
    case 'published':
      return EntityPublishState.Published;
    case 'modified':
      return EntityPublishState.Modified;
    case 'withdrawn':
      return EntityPublishState.Withdrawn;
    case 'archived':
      return EntityPublishState.Archived;
    default:
      assertExhaustive(status);
  }
}
