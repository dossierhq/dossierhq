import type {
  AdminEntityMutationOptions,
  AdminEntityUpdate,
  AdminEntityUpdatePayload,
  AdminSchema,
  ErrorType,
  PromiseResult,
  PublishedSchema,
} from '@jonasb/datadata-core';
import { AdminEntityStatus, ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { encodeAdminEntity, resolveUpdateEntity } from '../EntityCodec.js';
import { randomNameGenerator } from './AdminEntityMutationUtils.js';
import { publishEntityAfterMutation } from './publishEntityAfterMutation.js';

export async function adminUpdateEntity(
  adminSchema: AdminSchema,
  publishedSchema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityUpdate,
  options: AdminEntityMutationOptions | undefined
): PromiseResult<
  AdminEntityUpdatePayload,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  return await context.withTransaction(async (context) => {
    const entityInfoResult = await databaseAdapter.adminEntityUpdateGetEntityInfo(context, {
      id: entity.id,
    });
    if (entityInfoResult.isError()) {
      return entityInfoResult;
    }
    const {
      entityInternalId,
      name: previousName,
      authKey,
      resolvedAuthKey,
    } = entityInfoResult.value;

    const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
      authKey,
      resolvedAuthKey,
    });
    if (authResult.isError()) {
      return authResult;
    }

    const resolvedResult = resolveUpdateEntity(adminSchema, entity, entityInfoResult.value);
    if (resolvedResult.isError()) {
      return resolvedResult;
    }
    const { changed, entity: updatedEntity } = resolvedResult.value;
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
          }
        );
        if (publishResult.isError()) {
          return publishResult;
        }
        payload.effect = 'published';
        updatedEntity.info.status = publishResult.value.status;
        updatedEntity.info.updatedAt = publishResult.value.updatedAt;
      }

      return ok(payload);
    }

    const encodeResult = await encodeAdminEntity(
      adminSchema,
      databaseAdapter,
      context,
      updatedEntity
    );
    if (encodeResult.isError()) {
      return encodeResult;
    }
    const { data, name, referenceIds, locations, fullTextSearchText } = encodeResult.value;

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
        fieldValues: data,
        fullTextSearchText: fullTextSearchText.join(' '),
        referenceIds,
        locations,
      }
    );
    if (updateResult.isError()) {
      return updateResult;
    }

    let effect: AdminEntityUpdatePayload['effect'] = 'updated';
    updatedEntity.info.name = updateResult.value.name;
    updatedEntity.info.updatedAt = updateResult.value.updatedAt;

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
        }
      );
      if (publishResult.isError()) {
        return publishResult;
      }
      effect = 'updatedAndPublished';
      updatedEntity.info.status = publishResult.value.status;
      updatedEntity.info.updatedAt = publishResult.value.updatedAt;
    }

    return ok({ effect, entity: updatedEntity });
  });
}
