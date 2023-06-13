import type { EntityReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  DatabaseEntityUpdateEntityArg,
  DatabaseEntityUpdateEntityPayload,
  DatabaseEntityUpdateGetEntityInfoPayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import { UniqueConstraints } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone, queryNoneOrOne, queryOne } from '../QueryFunctions.js';
import { resolveEntityStatus } from '../utils/CodecUtils.js';
import { getSessionSubjectInternalId } from '../utils/SessionUtils.js';
import { withUniqueNameAttempt } from '../utils/withUniqueNameAttempt.js';
import { updateEntityLatestReferencesLocationsAndValueTypesIndexes } from './updateEntityLatestReferencesLocationsAndValueTypesIndexes.js';

export async function adminEntityUpdateGetEntityInfo(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference
): PromiseResult<
  DatabaseEntityUpdateGetEntityInfoPayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result = await queryNoneOrOne<
    Pick<
      EntitiesTable,
      | 'id'
      | 'type'
      | 'name'
      | 'auth_key'
      | 'resolved_auth_key'
      | 'created_at'
      | 'updated_at'
      | 'status'
      | 'valid'
    > &
      Pick<EntityVersionsTable, 'version' | 'data'>
  >(databaseAdapter, context, {
    text: `SELECT e.id, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.valid, ev.version, ev.data
        FROM entities e, entity_versions ev
        WHERE e.uuid = $1 AND e.latest_draft_entity_versions_id = ev.id`,
    values: [reference.id],
  });
  if (result.isError()) {
    return result;
  }
  if (!result.value) {
    return notOk.NotFound('No such entity');
  }

  const {
    id: entityInternalId,
    type,
    name,
    auth_key: authKey,
    resolved_auth_key: resolvedAuthKey,
    status,
    valid,
    version,
    created_at: createdAt,
    updated_at: updatedAt,
    data: fieldValues,
  } = result.value;

  return ok({
    entityInternalId,
    type,
    name,
    authKey,
    resolvedAuthKey,
    status: resolveEntityStatus(status),
    valid,
    version,
    createdAt,
    updatedAt,
    fieldValues,
  });
}

export async function adminEntityUpdateEntity(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseEntityUpdateEntityArg
): PromiseResult<DatabaseEntityUpdateEntityPayload, typeof ErrorType.Generic> {
  const createVersionResult = await queryOne<Pick<EntityVersionsTable, 'id'>>(
    databaseAdapter,
    context,
    {
      text: 'INSERT INTO entity_versions (entities_id, created_by, version, data) VALUES ($1, $2, $3, $4) RETURNING id',
      values: [
        entity.entityInternalId,
        getSessionSubjectInternalId(entity.session),
        entity.version,
        entity.fieldValues,
      ],
    }
  );
  if (createVersionResult.isError()) {
    return createVersionResult;
  }
  const { id: versionsId } = createVersionResult.value;

  let newName = entity.name;
  if (entity.changeName) {
    const nameResult = await withUniqueNameAttempt(
      context,
      entity.name,
      randomNameGenerator,
      async (context, name, nameConflictErrorMessage) => {
        const updateNameResult = await queryNone(
          databaseAdapter,
          context,
          {
            text: 'UPDATE entities SET name = $1 WHERE id = $2',
            values: [name, entity.entityInternalId],
          },
          (error) => {
            if (
              databaseAdapter.isUniqueViolationOfConstraint(
                error,
                UniqueConstraints.entities_name_key
              )
            ) {
              return notOk.Conflict(nameConflictErrorMessage);
            }
            return notOk.GenericUnexpectedException(context, error);
          }
        );
        if (updateNameResult.isError()) {
          return updateNameResult;
        }

        return ok(name);
      }
    );

    if (nameResult.isError()) return nameResult;
    newName = nameResult.value;
  }

  const updateEntityResult = await queryOne<Pick<EntitiesTable, 'updated_at'>>(
    databaseAdapter,
    context,
    {
      text: `UPDATE entities SET
      latest_draft_entity_versions_id = $1,
      latest_fts = to_tsvector($2),
      updated_at = NOW(),
      updated = nextval('entities_updated_seq'),
      status = $3,
      valid = TRUE,
      dirty = dirty & (~(1|4))
    WHERE id = $4
    RETURNING updated_at`,
      values: [versionsId, entity.fullTextSearchText, entity.status, entity.entityInternalId],
    }
  );
  if (updateEntityResult.isError()) return updateEntityResult;
  const { updated_at: updatedAt } = updateEntityResult.value;

  const updateReferencesIndexResult =
    await updateEntityLatestReferencesLocationsAndValueTypesIndexes(
      databaseAdapter,
      context,
      entity,
      entity.referenceIds,
      entity.locations,
      entity.valueTypes,
      { skipDelete: false }
    );
  if (updateReferencesIndexResult.isError()) return updateReferencesIndexResult;

  return ok({ name: newName, updatedAt });
}
