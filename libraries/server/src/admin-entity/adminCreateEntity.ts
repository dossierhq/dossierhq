import {
  AdminEntityStatus,
  notOk,
  ok,
  validateEntityInfoForCreate,
  contentValuePathToString,
  type AdminEntity,
  type AdminEntityCreate,
  type AdminEntityCreatePayload,
  type AdminEntityMutationOptions,
  type AdminSchemaWithMigrations,
  type ErrorType,
  type PromiseResult,
  type PublishedSchema,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authResolveAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { encodeAdminEntity, resolveCreateEntity } from '../EntityCodec.js';
import { randomNameGenerator } from './AdminEntityMutationUtils.js';
import { publishEntityAfterMutation } from './publishEntityAfterMutation.js';
import { updateUniqueIndexesForEntity } from './updateUniqueIndexesForEntity.js';

export async function adminCreateEntity(
  adminSchema: AdminSchemaWithMigrations,
  publishedSchema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityCreate,
  options: AdminEntityMutationOptions | undefined,
): PromiseResult<
  AdminEntityCreatePayload,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.Conflict
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  // validate
  const validationIssue = validateEntityInfoForCreate(adminSchema, ['entity'], entity);
  if (validationIssue) {
    return notOk.BadRequest(
      `${contentValuePathToString(validationIssue.path)}: ${validationIssue.message}`,
    );
  }

  // entity
  const resolvedResult = resolveCreateEntity(adminSchema, entity);
  if (resolvedResult.isError()) return resolvedResult;
  const { createEntity } = resolvedResult.value;

  // auth key
  const resolvedAuthKeyResult = await authResolveAuthorizationKey(
    authorizationAdapter,
    context,
    createEntity.info.authKey,
  );
  if (resolvedAuthKeyResult.isError()) return resolvedAuthKeyResult;

  // encode fields
  const encodeResult = await encodeAdminEntity(adminSchema, databaseAdapter, context, createEntity);
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
    const createResult = await databaseAdapter.adminEntityCreate(context, randomNameGenerator, {
      id: entity.id ?? null,
      type: encodeEntityPayload.type,
      name: encodeEntityPayload.name,
      version,
      session: context.session,
      resolvedAuthKey: resolvedAuthKeyResult.value,
      publish: !!options?.publish,
      schemaVersion: adminSchema.spec.version,
      encodeVersion: encodeEntityPayload.encodeVersion,
      fields: encodeEntityPayload.fields,
    });
    if (createResult.isError()) return createResult;
    const { id, name, createdAt, updatedAt } = createResult.value;

    const updateEntityIndexesResult = await databaseAdapter.adminEntityIndexesUpdateLatest(
      context,
      { entityInternalId: createResult.value.entityInternalId },
      encodeEntityPayload.entityIndexes,
      true,
    );
    if (updateEntityIndexesResult.isError()) return updateEntityIndexesResult;

    let effect: AdminEntityCreatePayload['effect'] = 'created';
    const payload: AdminEntity = {
      id,
      info: {
        ...createEntity.info,
        name,
        status: AdminEntityStatus.draft,
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

    if (options?.publish) {
      const publishResult = await publishEntityAfterMutation(
        adminSchema,
        publishedSchema,
        authorizationAdapter,
        databaseAdapter,
        context,
        { id, version: payload.info.version },
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
