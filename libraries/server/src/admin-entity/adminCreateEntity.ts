import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityCreatePayload,
  AdminEntityMutationOptions,
  AdminSchema,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { AdminEntityStatus, ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import { authResolveAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { encodeAdminEntity, resolveCreateEntity } from '../EntityCodec.js';
import { randomNameGenerator } from './AdminEntityMutationUtils.js';
import { publishEntityAfterMutation } from './publishEntityAfterMutation.js';

export async function adminCreateEntity(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityCreate,
  options: AdminEntityMutationOptions | undefined
): PromiseResult<
  AdminEntityCreatePayload,
  ErrorType.BadRequest | ErrorType.Conflict | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const resolvedResult = resolveCreateEntity(schema, entity);
  if (resolvedResult.isError()) {
    return resolvedResult;
  }
  const createEntity = resolvedResult.value;

  const resolvedAuthKeyResult = await authResolveAuthorizationKey(
    authorizationAdapter,
    context,
    entity.info.authKey
  );
  if (resolvedAuthKeyResult.isError()) {
    return resolvedAuthKeyResult;
  }

  const encodeResult = await encodeAdminEntity(schema, databaseAdapter, context, createEntity);
  if (encodeResult.isError()) {
    return encodeResult;
  }
  const encodeEntityResult = encodeResult.value;

  return await context.withTransaction(async (context) => {
    const createResult = await databaseAdapter.adminEntityCreate(context, randomNameGenerator, {
      id: entity.id ?? null,
      type: encodeEntityResult.type,
      name: encodeEntityResult.name,
      creator: context.session,
      resolvedAuthKey: resolvedAuthKeyResult.value,
      fullTextSearchText: encodeEntityResult.fullTextSearchText.join(' '),
      referenceIds: encodeEntityResult.referenceIds,
      locations: encodeEntityResult.locations,
      fieldsData: encodeEntityResult.data,
    });
    if (createResult.isError()) {
      return createResult;
    }

    const { id, name, createdAt, updatedAt } = createResult.value;

    let effect: AdminEntityCreatePayload['effect'] = 'created';
    const result: AdminEntity = {
      id,
      info: {
        ...createEntity.info,
        name,
        status: AdminEntityStatus.draft,
        version: 0,
        createdAt,
        updatedAt,
      },
      fields: createEntity.fields ?? {},
    };

    if (options?.publish) {
      const publishResult = await publishEntityAfterMutation(
        schema,
        authorizationAdapter,
        databaseAdapter,
        context,
        { id, version: result.info.version }
      );
      if (publishResult.isError()) {
        return publishResult;
      }
      effect = 'createdAndPublished';
      result.info.status = publishResult.value.status;
      result.info.updatedAt = publishResult.value.updatedAt;
    }

    return ok({ effect, entity: result });
  });
}
