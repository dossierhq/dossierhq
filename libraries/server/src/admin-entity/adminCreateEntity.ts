import {
  EntityStatus,
  EventType,
  contentValuePathToString,
  notOk,
  ok,
  validateEntityInfoForCreate,
  type AdminEntity,
  type AdminEntityCreate,
  type AdminEntityCreatePayload,
  type AdminEntityMutationOptions,
  type SchemaWithMigrations,
  type CreateEntitySyncEvent,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authResolveAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { encodeAdminEntity, resolveCreateEntity } from '../EntityCodec.js';
import { randomNameGenerator } from './AdminEntityMutationUtils.js';
import { adminPublishEntityAfterMutation } from './adminPublishEntities.js';
import { updateUniqueIndexesForEntity } from './updateUniqueIndexesForEntity.js';

export async function adminCreateEntity(
  adminSchema: SchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityCreate,
  options: AdminEntityMutationOptions | undefined,
): PromiseResult<
  AdminEntityCreatePayload,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.Conflict
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  return doCreateEntity(
    adminSchema,
    authorizationAdapter,
    databaseAdapter,
    context,
    entity,
    !!options?.publish,
    null,
  );
}

export async function adminCreateEntitySyncEvent(
  adminSchema: SchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  syncEvent: CreateEntitySyncEvent,
): PromiseResult<
  AdminEntityCreatePayload,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.Conflict
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  if (adminSchema.spec.version !== syncEvent.entity.info.schemaVersion) {
    return notOk.BadRequest(
      `Schema version mismatch: expected ${adminSchema.spec.version}, got ${syncEvent.entity.info.schemaVersion}`,
    );
  }
  return doCreateEntity(
    adminSchema,
    authorizationAdapter,
    databaseAdapter,
    context,
    syncEvent.entity,
    syncEvent.type === EventType.createAndPublishEntity,
    syncEvent,
  );
}

async function doCreateEntity(
  adminSchema: SchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityCreate,
  publish: boolean,
  syncEvent: CreateEntitySyncEvent | null,
): PromiseResult<
  AdminEntityCreatePayload,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.Conflict
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  if (context.session.type === 'readonly') {
    return notOk.BadRequest('Readonly session used to create entity');
  }
  const { session } = context;

  // validate
  const validationIssue = validateEntityInfoForCreate(adminSchema, ['entity'], entity);
  if (validationIssue) {
    return notOk.BadRequest(
      `${contentValuePathToString(validationIssue.path)}: ${validationIssue.message}`,
    );
  }

  // entity
  const resolvedResult = resolveCreateEntity(adminSchema, entity);
  if (resolvedResult.isError()) return resolvedResult;
  const { createEntity } = resolvedResult.value;

  // auth key
  const resolvedAuthKeyResult = await authResolveAuthorizationKey(
    authorizationAdapter,
    context,
    createEntity.info.authKey ?? '',
  );
  if (resolvedAuthKeyResult.isError()) return resolvedAuthKeyResult;
  const resolvedAuthKey = resolvedAuthKeyResult.value;

  if (syncEvent && syncEvent.entity.info.resolvedAuthKey !== resolvedAuthKey.resolvedAuthKey) {
    return notOk.BadRequest(
      `Resolved auth key mismatch for ${resolvedAuthKey.authKey}: expected ${syncEvent.entity.info.resolvedAuthKey}, got ${resolvedAuthKey.resolvedAuthKey}`,
    );
  }

  // encode fields
  const encodeResult = await encodeAdminEntity(adminSchema, databaseAdapter, context, createEntity);
  if (encodeResult.isError()) return encodeResult;
  const encodeEntityPayload = encodeResult.value;

  if (encodeEntityPayload.validationIssues.length > 0) {
    const firstValidationIssue = encodeEntityPayload.validationIssues[0];
    return notOk.BadRequest(
      `${contentValuePathToString(firstValidationIssue.path)}: ${firstValidationIssue.message}`,
    );
  }

  const version = 1;

  return await context.withTransaction(async (context) => {
    const createResult = await databaseAdapter.adminEntityCreate(
      context,
      randomNameGenerator,
      {
        id: entity.id ?? null,
        type: encodeEntityPayload.type,
        name: encodeEntityPayload.name,
        version,
        session,
        resolvedAuthKey,
        publish,
        schemaVersion: adminSchema.spec.version,
        encodeVersion: encodeEntityPayload.encodeVersion,
        fields: encodeEntityPayload.fields,
      },
      syncEvent,
    );
    if (createResult.isError()) return createResult;
    const { id, name, createdAt, updatedAt } = createResult.value;

    const updateEntityIndexesResult = await databaseAdapter.adminEntityIndexesUpdateLatest(
      context,
      { entityInternalId: createResult.value.entityInternalId },
      encodeEntityPayload.entityIndexes,
      true,
    );
    if (updateEntityIndexesResult.isError()) return updateEntityIndexesResult;

    let effect: AdminEntityCreatePayload['effect'] = 'created';
    const payload: AdminEntity = {
      id,
      info: {
        type: createEntity.info.type,
        authKey: resolvedAuthKey.authKey,
        name,
        status: EntityStatus.draft,
        valid: true,
        validPublished: null,
        version,
        createdAt,
        updatedAt,
      },
      fields: createEntity.fields ?? {},
    };

    const uniqueIndexResult = await updateUniqueIndexesForEntity(
      databaseAdapter,
      context,
      createResult.value,
      true,
      encodeEntityPayload.uniqueIndexValues,
      null, // TODO publishEntityAfterMutation is updating the values
    );
    if (uniqueIndexResult.isError()) return uniqueIndexResult;
    if (uniqueIndexResult.value.conflictingValues.length > 0) {
      return notOk.BadRequest(
        uniqueIndexResult.value.conflictingValues
          .map(
            ({ index, value, path }) =>
              `${contentValuePathToString(path)}: Value is not unique (${index}:${value})`,
          )
          .join('\n'),
      );
    }

    if (publish) {
      const publishResult = await adminPublishEntityAfterMutation(
        adminSchema,
        authorizationAdapter,
        databaseAdapter,
        context,
        { id, version: payload.info.version },
        syncEvent,
      );
      if (publishResult.isError()) return publishResult;

      effect = 'createdAndPublished';
      payload.info.status = publishResult.value.status;
      payload.info.updatedAt = publishResult.value.updatedAt;
      payload.info.validPublished = true;
    }

    return ok({ effect, entity: payload });
  });
}
