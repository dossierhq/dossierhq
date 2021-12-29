import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityCreatePayload,
  AdminSchema,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { AdminEntityStatus, ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authResolveAuthorizationKey } from '../Auth';
import { randomNameGenerator } from './AdminEntityMutationUtils';
import { encodeEntity, resolveCreateEntity } from '../EntityCodec';

export async function adminCreateEntity(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityCreate
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

  const encodeResult = await encodeEntity(schema, databaseAdapter, context, createEntity);
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
    return ok({ effect: 'created', entity: result });
  });
}
