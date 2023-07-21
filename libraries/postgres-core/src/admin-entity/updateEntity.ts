import type { EntityReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  DatabaseEntityUpdateEntityArg,
  DatabaseEntityUpdateEntityPayload,
  DatabaseEntityUpdateGetEntityInfoPayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import {
  ENTITY_DIRTY_FLAG_INDEX_LATEST,
  ENTITY_DIRTY_FLAG_VALIDATE_LATEST,
  UniqueConstraints,
} from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone, queryNoneOrOne, queryOne } from '../QueryFunctions.js';
import { resolveAdminEntityInfo, resolveEntityFields } from '../utils/CodecUtils.js';
import { getSessionSubjectInternalId } from '../utils/SessionUtils.js';
import { withUniqueNameAttempt } from '../utils/withUniqueNameAttempt.js';

export async function adminEntityUpdateGetEntityInfo(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference,
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
      | 'invalid'
    > &
      Pick<EntityVersionsTable, 'version' | 'schema_version' | 'data'>
  >(databaseAdapter, context, {
    text: `SELECT e.id, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.invalid, ev.version, ev.schema_version, ev.data
        FROM entities e, entity_versions ev
        WHERE e.uuid = $1 AND e.latest_draft_entity_versions_id = ev.id`,
    values: [reference.id],
  });
  if (result.isError()) return result;

  if (!result.value) {
    return notOk.NotFound('No such entity');
  }

  const { id: entityInternalId, resolved_auth_key: resolvedAuthKey } = result.value;

  return ok({
    ...resolveAdminEntityInfo(result.value),
    ...resolveEntityFields(result.value),
    entityInternalId,
    resolvedAuthKey,
  });
}

export async function adminEntityUpdateEntity(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseEntityUpdateEntityArg,
): PromiseResult<DatabaseEntityUpdateEntityPayload, typeof ErrorType.Generic> {
  const createVersionResult = await queryOne<Pick<EntityVersionsTable, 'id'>>(
    databaseAdapter,
    context,
    {
      text: 'INSERT INTO entity_versions (entities_id, created_by, version, schema_version, data) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      values: [
        entity.entityInternalId,
        getSessionSubjectInternalId(entity.session),
        entity.version,
        entity.schemaVersion,
        entity.fieldValues,
      ],
    },
  );
  if (createVersionResult.isError()) return createVersionResult;
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
                UniqueConstraints.entities_name_key,
              )
            ) {
              return notOk.Conflict(nameConflictErrorMessage);
            }
            return notOk.GenericUnexpectedException(context, error);
          },
        );
        if (updateNameResult.isError()) return updateNameResult;

        return ok(name);
      },
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
      updated_at = NOW(),
      updated = nextval('entities_updated_seq'),
      status = $2,
      invalid = invalid & ~1,
      dirty = dirty & $3
    WHERE id = $4
    RETURNING updated_at`,
      values: [
        versionsId,
        entity.status,
        ~(ENTITY_DIRTY_FLAG_VALIDATE_LATEST | ENTITY_DIRTY_FLAG_INDEX_LATEST),
        entity.entityInternalId,
      ],
    },
  );
  if (updateEntityResult.isError()) return updateEntityResult;
  const { updated_at: updatedAt } = updateEntityResult.value;

  return ok({ name: newName, updatedAt });
}
