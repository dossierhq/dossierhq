import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityCreatePayload,
  AdminEntityMutationOptions,
  AdminSchema,
  ErrorType,
  PromiseResult,
  PublishedSchema,
} from '@jonasb/datadata-core';
import { AdminEntityStatus, notOk, ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import { authResolveAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { encodeAdminEntity, resolveCreateEntity } from '../EntityCodec.js';
import { randomNameGenerator } from './AdminEntityMutationUtils.js';
import { publishEntityAfterMutation } from './publishEntityAfterMutation.js';
import { updateUniqueIndexesForEntity } from './updateUniqueIndexesForEntity.js';

export async function adminCreateEntity(
  adminSchema: AdminSchema,
  publishedSchema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityCreate,
  options: AdminEntityMutationOptions | undefined
): PromiseResult<
  AdminEntityCreatePayload,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.Conflict
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  // entity
  const resolvedResult = resolveCreateEntity(adminSchema, entity);
  if (resolvedResult.isError()) return resolvedResult;
  const { createEntity, entitySpec } = resolvedResult.value;

  // auth key
  const resolvedAuthKeyResult = await authResolveAuthorizationKey(
    authorizationAdapter,
    context,
    createEntity.info.authKey
  );
  if (resolvedAuthKeyResult.isError()) return resolvedAuthKeyResult;

  if (entitySpec.authKeyPattern) {
    const authKeyRegExp = adminSchema.getPatternRegExp(entitySpec.authKeyPattern);
    if (!authKeyRegExp) {
      return notOk.Generic(
        `Pattern '${entitySpec.authKeyPattern}' for authKey of type '${entitySpec.name}' not found`
      );
    }
    if (!authKeyRegExp.test(createEntity.info.authKey)) {
      return notOk.BadRequest(
        `AuthKey '${createEntity.info.authKey}' does not match pattern '${entitySpec.authKeyPattern}' (${authKeyRegExp.source})`
      );
    }
  }

  // encode fields
  const encodeResult = await encodeAdminEntity(adminSchema, databaseAdapter, context, createEntity);
  if (encodeResult.isError()) return encodeResult;
  const encodeEntityResult = encodeResult.value;

  return await context.withTransaction(async (context) => {
    const createResult = await databaseAdapter.adminEntityCreate(context, randomNameGenerator, {
      id: entity.id ?? null,
      type: encodeEntityResult.type,
      name: encodeEntityResult.name,
      creator: context.session,
      resolvedAuthKey: resolvedAuthKeyResult.value,
      fullTextSearchText: encodeEntityResult.fullTextSearchText,
      referenceIds: encodeEntityResult.referenceIds,
      locations: encodeEntityResult.locations,
      fieldsData: encodeEntityResult.data,
    });
    if (createResult.isError()) return createResult;
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
        adminSchema,
        publishedSchema,
        authorizationAdapter,
        databaseAdapter,
        context,
        { id, version: result.info.version }
      );
      if (publishResult.isError()) return publishResult;

      effect = 'createdAndPublished';
      result.info.status = publishResult.value.status;
      result.info.updatedAt = publishResult.value.updatedAt;
    }

    const uniqueIndexResult = await updateUniqueIndexesForEntity(
      databaseAdapter,
      context,
      createResult.value,
      encodeEntityResult.uniqueIndexValues,
      true,
      !!options?.publish
    );
    if (uniqueIndexResult.isError()) return uniqueIndexResult;

    return ok({ effect, entity: result });
  });
}
