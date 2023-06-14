import {
  copyEntity,
  ok,
  type AdminClient,
  type AdminSchemaSpecificationUpdate,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import {
  ChangeValidationsWithoutValidationsUpdate,
  IntegrationTestSchema,
} from '../IntegrationTestSchema.js';
import type { AdminChangeValidations } from '../SchemaTypes.js';
import { CHANGE_VALIDATIONS_CREATE } from './Fixtures.js';

interface Options {
  skipRevalidateAllEntities?: boolean;
}

export async function createInvalidEntity(
  server: Server,
  adminClient: AdminClient,
  options?: Options
): PromiseResult<
  AdminChangeValidations,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.Conflict
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  return await withTemporarySchemaChange(
    server,
    adminClient,
    ChangeValidationsWithoutValidationsUpdate,
    options,
    async () => {
      const result = await adminClient.createEntity<AdminChangeValidations>(
        copyEntity(CHANGE_VALIDATIONS_CREATE, { fields: { matchPattern: 'no match' } })
      );
      return result.isOk() ? ok(result.value.entity) : result;
    }
  );
}

async function withTemporarySchemaChange<TOk, TError extends ErrorType>(
  server: Server,
  adminClient: AdminClient,
  schemaUpdate: AdminSchemaSpecificationUpdate,
  options: Options = {},
  worker: () => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  // remove validations from the schema
  const removeValidationsResult = await adminClient.updateSchemaSpecification(schemaUpdate);
  if (removeValidationsResult.isError()) return removeValidationsResult;

  const result = await worker();

  // restore validations to the schema
  const restoreSchemaResult = await adminClient.updateSchemaSpecification(IntegrationTestSchema);
  if (restoreSchemaResult.isError()) return restoreSchemaResult;

  // validate
  if (options.skipRevalidateAllEntities !== true) {
    let done = false;
    while (!done) {
      const validationResult = await server.revalidateNextEntity();
      if (validationResult.isError()) return validationResult;
      if (!validationResult.value) {
        done = true;
      }
    }
  }

  return result;
}
