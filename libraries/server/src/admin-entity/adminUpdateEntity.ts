import {
  AdminEntityStatus,
  notOk,
  ok,
  validateEntityInfoForUpdate,
  visitorPathToString,
  type AdminEntityMutationOptions,
  type AdminEntityUpdate,
  type AdminEntityUpdatePayload,
  type AdminSchemaWithMigrations,
  type ErrorType,
  type PromiseResult,
  type PublishedSchema,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { encodeAdminEntity, resolveUpdateEntity } from '../EntityCodec.js';
import { randomNameGenerator } from './AdminEntityMutationUtils.js';
import { publishEntityAfterMutation } from './publishEntityAfterMutation.js';
import { updateUniqueIndexesForEntity } from './updateUniqueIndexesForEntity.js';

export async function adminUpdateEntity(
  adminSchema: AdminSchemaWithMigrations,
  publishedSchema: PublishedSchema,
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
  return await context.withTransaction(async (context) => {
    // get info of existing entity
    const entityInfoResult = await databaseAdapter.adminEntityUpdateGetEntityInfo(context, {
      id: entity.id,
    });
    if (entityInfoResult.isError()) return entityInfoResult;
    const {
      entityInternalId,
      name: previousName,
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
        `${visitorPathToString(validationIssue.path)}: ${validationIssue.message}`,
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
    const { changed, entity: updatedEntity, entitySpec } = resolvedResult.value;

    if (!changed) {
      const payload: AdminEntityUpdatePayload = { effect: 'none', entity: updatedEntity };
      if (options?.publish && updatedEntity.info.status !== AdminEntityStatus.published) {
        const publishResult = await publishEntityAfterMutation(
          adminSchema,
          publishedSchema,
          authorizationAdapter,
          databaseAdapter,
          context,
          {
            id: updatedEntity.id,
            version: updatedEntity.info.version,
          },
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
      entitySpec,
      updatedEntity,
    );
    if (encodeResult.isError()) return encodeResult;
    const { data, name } = encodeResult.value;

    const updateResult = await databaseAdapter.adminEntityUpdateEntity(
      context,
      randomNameGenerator,
      {
        entityInternalId,
        name: updatedEntity.info.name,
        changeName: name !== previousName,
        session: context.session,
        version: updatedEntity.info.version,
        status: updatedEntity.info.status,
        schemaVersion: adminSchema.spec.version,
        fieldValues: data,
      },
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
              `${visitorPathToString(path)}: Value is not unique (${index}:${value})`,
          )
          .join('\n'),
      );
    }

    if (options?.publish) {
      const publishResult = await publishEntityAfterMutation(
        adminSchema,
        publishedSchema,
        authorizationAdapter,
        databaseAdapter,
        context,
        {
          id: updatedEntity.id,
          version: updatedEntity.info.version,
        },
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
