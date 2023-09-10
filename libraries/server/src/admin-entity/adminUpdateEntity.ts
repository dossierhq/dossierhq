import {
  AdminEntityStatus,
  EventType,
  contentValuePathToString,
  notOk,
  ok,
  validateEntityInfoForUpdate,
  type AdminEntityMutationOptions,
  type AdminEntityUpdate,
  type AdminEntityUpdatePayload,
  type AdminSchemaWithMigrations,
  type ErrorType,
  type PromiseResult,
  type UpdateEntitySyncEvent,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { encodeAdminEntity, resolveUpdateEntity } from '../EntityCodec.js';
import { randomNameGenerator } from './AdminEntityMutationUtils.js';
import { adminPublishEntityAfterMutation } from './adminPublishEntities.js';
import { updateUniqueIndexesForEntity } from './updateUniqueIndexesForEntity.js';

export async function adminUpdateEntity(
  adminSchema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityUpdate,
  options: AdminEntityMutationOptions | undefined,
): PromiseResult<
  AdminEntityUpdatePayload,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  return doUpdateEntity(
    adminSchema,
    authorizationAdapter,
    databaseAdapter,
    context,
    entity,
    options,
    null,
  );
}

export async function adminUpdateEntitySyncEvent(
  adminSchema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  syncEvent: UpdateEntitySyncEvent,
) {
  if (adminSchema.spec.version !== syncEvent.entity.info.schemaVersion) {
    return notOk.BadRequest(
      `Schema version mismatch: expected ${adminSchema.spec.version}, got ${syncEvent.entity.info.schemaVersion}`,
    );
  }

  return doUpdateEntity(
    adminSchema,
    authorizationAdapter,
    databaseAdapter,
    context,
    syncEvent.entity,
    { publish: syncEvent.type === EventType.updateAndPublishEntity },
    syncEvent,
  );
}

async function doUpdateEntity(
  adminSchema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityUpdate,
  options: AdminEntityMutationOptions | undefined,
  syncEvent: UpdateEntitySyncEvent | null,
): PromiseResult<
  AdminEntityUpdatePayload,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  {
    return await context.withTransaction(async (context) => {
      // get info of existing entity
      const entityInfoResult = await databaseAdapter.adminEntityUpdateGetEntityInfo(context, {
        id: entity.id,
      });
      if (entityInfoResult.isError()) return entityInfoResult;
      const {
        entityInternalId,
        name: previousName,
        publishedName,
        authKey,
        resolvedAuthKey,
      } = entityInfoResult.value;

      // validate
      const validationIssue = validateEntityInfoForUpdate(
        ['entity'],
        { info: entityInfoResult.value },
        entity,
      );
      if (validationIssue) {
        return notOk.BadRequest(
          `${contentValuePathToString(validationIssue.path)}: ${validationIssue.message}`,
        );
      }

      // auth key
      const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
        authKey,
        resolvedAuthKey,
      });
      if (authResult.isError()) return authResult;

      const resolvedResult = resolveUpdateEntity(adminSchema, entity, entityInfoResult.value);
      if (resolvedResult.isError()) return resolvedResult;
      const { changed, entity: updatedEntity } = resolvedResult.value;

      if (!changed) {
        const payload: AdminEntityUpdatePayload = { effect: 'none', entity: updatedEntity };
        if (options?.publish && updatedEntity.info.status !== AdminEntityStatus.published) {
          const publishResult = await adminPublishEntityAfterMutation(
            adminSchema,
            authorizationAdapter,
            databaseAdapter,
            context,
            { id: updatedEntity.id, version: updatedEntity.info.version },
            syncEvent,
          );
          if (publishResult.isError()) return publishResult;
          payload.effect = 'published';
          updatedEntity.info.status = publishResult.value.status;
          updatedEntity.info.updatedAt = publishResult.value.updatedAt;
          updatedEntity.info.validPublished = true;
        }

        return ok(payload);
      }

      const encodeResult = await encodeAdminEntity(
        adminSchema,
        databaseAdapter,
        context,
        updatedEntity,
      );
      if (encodeResult.isError()) return encodeResult;
      if (encodeResult.value.validationIssues.length > 0) {
        const firstValidationIssue = encodeResult.value.validationIssues[0];
        return notOk.BadRequest(
          `${contentValuePathToString(firstValidationIssue.path)}: ${firstValidationIssue.message}`,
        );
      }
      const { fields, name, encodeVersion } = encodeResult.value;

      const publish = !!options?.publish;
      const updateResult = await databaseAdapter.adminEntityUpdateEntity(
        context,
        randomNameGenerator,
        {
          entityInternalId,
          name: updatedEntity.info.name,
          changeName: name !== previousName || (publish && name !== publishedName),
          type: updatedEntity.info.type,
          publish,
          session: context.session,
          version: updatedEntity.info.version,
          status: updatedEntity.info.status,
          schemaVersion: adminSchema.spec.version,
          encodeVersion,
          fields,
        },
        syncEvent,
      );
      if (updateResult.isError()) return updateResult;

      let effect: AdminEntityUpdatePayload['effect'] = 'updated';
      updatedEntity.info.name = updateResult.value.name;
      updatedEntity.info.updatedAt = updateResult.value.updatedAt;

      const updateEntityIndexesResult = await databaseAdapter.adminEntityIndexesUpdateLatest(
        context,
        { entityInternalId },
        encodeResult.value.entityIndexes,
        false,
      );
      if (updateEntityIndexesResult.isError()) return updateEntityIndexesResult;

      const uniqueIndexResult = await updateUniqueIndexesForEntity(
        databaseAdapter,
        context,
        { entityInternalId },
        false,
        encodeResult.value.uniqueIndexValues,
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

      if (options?.publish) {
        const publishResult = await adminPublishEntityAfterMutation(
          adminSchema,
          authorizationAdapter,
          databaseAdapter,
          context,
          { id: updatedEntity.id, version: updatedEntity.info.version },
          syncEvent,
        );
        if (publishResult.isError()) return publishResult;

        effect = 'updatedAndPublished';
        updatedEntity.info.status = publishResult.value.status;
        updatedEntity.info.updatedAt = publishResult.value.updatedAt;
        updatedEntity.info.validPublished = true;
      }

      return ok({ effect, entity: updatedEntity });
    });
  }
}
