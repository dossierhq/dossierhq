import type {
  AdminEntityMutationOptions,
  AdminEntityUpdate,
  AdminEntityUpdatePayload,
  AdminSchema,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { AdminEntityStatus, ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import { encodeEntity, resolveUpdateEntity } from '../EntityCodec';
import { randomNameGenerator } from './AdminEntityMutationUtils';
import { publishEntityAfterMutation } from './publishEntityAfterMutation';

export async function adminUpdateEntity(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityUpdate,
  options: AdminEntityMutationOptions | undefined
): PromiseResult<
  AdminEntityUpdatePayload,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
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

    const authResult = await authVerifyAuthorizationKey(
      authorizationAdapter,
      context,
      entity?.info?.authKey ? [entity.info.authKey] : undefined,
      { authKey, resolvedAuthKey }
    );
    if (authResult.isError()) {
      return authResult;
    }

    const resolvedResult = resolveUpdateEntity(schema, entity, entityInfoResult.value);
    if (resolvedResult.isError()) {
      return resolvedResult;
    }
    const { changed, entity: updatedEntity } = resolvedResult.value;
    if (!changed) {
      const payload: AdminEntityUpdatePayload = { effect: 'none', entity: updatedEntity };
      if (options?.publish && updatedEntity.info.status !== AdminEntityStatus.published) {
        const publishResult = await publishEntityAfterMutation(
          schema,
          authorizationAdapter,
          databaseAdapter,
          context,
          {
            id: updatedEntity.id,
            version: updatedEntity.info.version,
            authKeys: [updatedEntity.info.authKey],
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

    const encodeResult = await encodeEntity(schema, databaseAdapter, context, updatedEntity);
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
        schema,
        authorizationAdapter,
        databaseAdapter,
        context,
        {
          id: updatedEntity.id,
          version: updatedEntity.info.version,
          authKeys: [updatedEntity.info.authKey],
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
