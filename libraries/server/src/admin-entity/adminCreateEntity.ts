import {
  EntityStatus,
  EventType,
  contentValuePathToString,
  notOk,
  ok,
  validateEntityInfoForCreate,
  type Entity,
  type EntityCreate,
  type EntityCreatePayload,
  type EntityMutationOptions,
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
  schema: SchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: EntityCreate,
  options: EntityMutationOptions | undefined,
): PromiseResult<
  EntityCreatePayload,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.Conflict
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  return doCreateEntity(
    schema,
    authorizationAdapter,
    databaseAdapter,
    context,
    entity,
    !!options?.publish,
    null,
  );
}

export async function adminCreateEntitySyncEvent(
  schema: SchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  syncEvent: CreateEntitySyncEvent,
): PromiseResult<
  EntityCreatePayload,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.Conflict
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  if (schema.spec.version !== syncEvent.entity.info.schemaVersion) {
    return notOk.BadRequest(
      `Schema version mismatch: expected ${schema.spec.version}, got ${syncEvent.entity.info.schemaVersion}`,
    );
  }
  return doCreateEntity(
    schema,
    authorizationAdapter,
    databaseAdapter,
    context,
    syncEvent.entity,
    syncEvent.type === EventType.createAndPublishEntity,
    syncEvent,
  );
}

async function doCreateEntity(
  schema: SchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: EntityCreate,
  publish: boolean,
  syncEvent: CreateEntitySyncEvent | null,
): PromiseResult<
  EntityCreatePayload,
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
  const validationIssue = validateEntityInfoForCreate(schema, ['entity'], entity);
  if (validationIssue) {
    return notOk.BadRequest(
      `${contentValuePathToString(validationIssue.path)}: ${validationIssue.message}`,
    );
  }

  // entity
  const resolvedResult = resolveCreateEntity(schema, entity);
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
  const encodeResult = await encodeAdminEntity(schema, databaseAdapter, context, createEntity);
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
        schemaVersion: schema.spec.version,
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

    let effect: EntityCreatePayload['effect'] = 'created';
    const payload: Entity = {
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
        schema,
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
