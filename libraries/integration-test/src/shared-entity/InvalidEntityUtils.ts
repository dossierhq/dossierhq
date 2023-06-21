import {
  copyEntity,
  ok,
  withAdvisoryLock,
  type AdminClient,
  type AdminEntity,
  type AdminEntityCreate,
  type AdminSchemaSpecificationUpdate,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import {
  ChangeValidationsValueItemWithoutValidationsUpdate,
  ChangeValidationsWithoutValidationsUpdate,
  IntegrationTestSchema,
} from '../IntegrationTestSchema.js';
import type { AdminChangeValidations, AdminValueItems } from '../SchemaTypes.js';
import { CHANGE_VALIDATIONS_CREATE, VALUE_ITEMS_CREATE } from './Fixtures.js';

interface Options {
  publish?: boolean;
  skipProcessDirtyEntities?: boolean;
}

export async function createInvalidEntity(
  server: Server,
  adminClient: AdminClient,
  fields: Partial<AdminChangeValidations['fields']>,
  options?: Options
) {
  return doCreateInvalidEntity<AdminChangeValidations>(
    server,
    adminClient,
    ChangeValidationsWithoutValidationsUpdate,
    copyEntity(CHANGE_VALIDATIONS_CREATE, { fields }),
    options
  );
}

export async function createEntityWithInvalidValueItem(
  server: Server,
  adminClient: AdminClient,
  options?: Options
) {
  return doCreateInvalidEntity<AdminValueItems>(
    server,
    adminClient,
    ChangeValidationsValueItemWithoutValidationsUpdate,
    copyEntity(VALUE_ITEMS_CREATE, {
      fields: { any: { type: 'ChangeValidationsValueItem', matchPattern: 'no match' } },
    }),
    options
  );
}

async function doCreateInvalidEntity<TEntity extends AdminEntity<string, object> = AdminEntity>(
  server: Server,
  adminClient: AdminClient,
  schemaUpdate: AdminSchemaSpecificationUpdate,
  entity: AdminEntityCreate<TEntity>,
  options?: Options
): PromiseResult<
  TEntity,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.Conflict
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  return await withTemporarySchemaChange(server, adminClient, schemaUpdate, options, async () => {
    const result = await adminClient.createEntity<TEntity>(entity, { publish: options?.publish });
    return result.isOk() ? ok(result.value.entity) : result;
  });
}

async function withTemporarySchemaChange<TOk, TError extends ErrorType>(
  server: Server,
  adminClient: AdminClient,
  schemaUpdate: AdminSchemaSpecificationUpdate,
  options: Options = {},
  worker: () => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return await withAdvisoryLock(
    adminClient,
    'schema-update',
    { leaseDuration: 2000, acquireInterval: 1000, renewInterval: 1000 },
    async (): PromiseResult<
      TOk,
      TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic
    > => {
      // remove validations from the schema
      const removeValidationsResult = await adminClient.updateSchemaSpecification(schemaUpdate);
      if (removeValidationsResult.isError()) return removeValidationsResult;

      const workerResult = await worker();

      // restore validations to the schema
      const restoreSchemaResult = await adminClient.updateSchemaSpecification(
        IntegrationTestSchema
      );
      if (restoreSchemaResult.isError()) return restoreSchemaResult;

      // validate
      if (options.skipProcessDirtyEntities !== true) {
        let done = false;
        while (!done) {
          const processResult = await server.processNextDirtyEntity();
          if (processResult.isError()) return processResult;
          if (!processResult.value) {
            done = true;
          }
        }
      }

      return workerResult;
    }
  );
}
