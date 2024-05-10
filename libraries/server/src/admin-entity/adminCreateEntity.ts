import {
  contentValuePathToString,
  EntityStatus,
  ErrorType,
  EventType,
  getEntityNameBase,
  isFieldValueEqual,
  notOk,
  ok,
  validateEntityInfoForCreate,
  type CreateEntitySyncEvent,
  type Entity,
  type EntityCreate,
  type EntityCreatePayload,
  type EntityMutationOptions,
  type PromiseResult,
  type SchemaWithMigrations,
} from '@dossierhq/core';
import type { DatabaseAdapter, ResolvedAuthKey } from '@dossierhq/database-adapter';
import { authResolveAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodeAdminEntity, encodeAdminEntity, resolveCreateEntity } from '../EntityCodec.js';
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

  const result = await context.withTransaction<
    EntityCreatePayload,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.Conflict
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >(async (context) => {
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

  if (result.isError() && result.isErrorType(ErrorType.Conflict) && entity.id) {
    return handleConflictWhenEntityIdIsProvided(
      schema,
      databaseAdapter,
      context,
      entity.id,
      resolvedAuthKey,
      createEntity, // contains normalized fields
      publish,
      result,
    );
  }

  return result;
}

async function handleConflictWhenEntityIdIsProvided(
  schema: SchemaWithMigrations,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entityId: string,
  resolvedAuthKey: ResolvedAuthKey,
  entityCreate: EntityCreate,
  publish: boolean,
  originalError: Awaited<ReturnType<typeof doCreateEntity>>,
): ReturnType<typeof doCreateEntity> {
  // Fetch existing entity
  const getResult = await databaseAdapter.adminEntityGetOne(context, { id: entityId });
  if (getResult.isError()) return originalError;

  const decodeResult = decodeAdminEntity(schema, getResult.value);
  if (decodeResult.isError()) return originalError;
  const existingEntity = decodeResult.value;

  //TODO check creator

  //  Ensure it hasn't been updated
  if (existingEntity.info.version !== 1) {
    return originalError;
  }

  // Ensure authKey is as expected
  if (
    resolvedAuthKey.authKey !== getResult.value.authKey ||
    resolvedAuthKey.resolvedAuthKey !== getResult.value.resolvedAuthKey
  ) {
    return originalError;
  }

  // Ensure entity info is as expected
  if (entityCreate.info.type !== existingEntity.info.type) {
    return originalError;
  }

  if (
    entityCreate.info.name &&
    getEntityNameBase(entityCreate.info.name) !== getEntityNameBase(existingEntity.info.name)
  ) {
    return originalError;
  }

  const expectedStatus = publish ? 'published' : 'draft';
  if (expectedStatus !== existingEntity.info.status) return originalError;

  // Ensure fields are as expected
  if (!isFieldValueEqual(entityCreate.fields, existingEntity.fields)) {
    return originalError;
  }

  return ok({ effect: 'none', entity: existingEntity });
}
