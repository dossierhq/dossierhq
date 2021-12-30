import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityCreatePayload,
  AdminEntityMutationOptions,
  AdminSchema,
  PromiseResult,
} from '@jonasb/datadata-core';
import { AdminEntityStatus, ErrorType, notOk, ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authResolveAuthorizationKey } from '../Auth';
import { encodeEntity, resolveCreateEntity } from '../EntityCodec';
import { randomNameGenerator } from './AdminEntityMutationUtils';
import { adminPublishEntities } from './adminPublishEntities';

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

    if (options?.publish) {
      //TODO pass authkey along
      const publishResult = await adminPublishEntities(
        schema,
        authorizationAdapter,
        databaseAdapter,
        context,
        [{ id, version: result.info.version }]
      );
      if (publishResult.isError()) {
        if (
          publishResult.isErrorType(ErrorType.BadRequest) ||
          publishResult.isErrorType(ErrorType.NotAuthorized) ||
          publishResult.isErrorType(ErrorType.Generic)
        ) {
          return publishResult;
        }
        // NotFound
        return notOk.GenericUnexpectedError(publishResult);
      }
      result.info.status = publishResult.value[0].status;
      result.info.updatedAt = publishResult.value[0].updatedAt;
    }

    return ok({ effect: 'created', entity: result });
  });
}
