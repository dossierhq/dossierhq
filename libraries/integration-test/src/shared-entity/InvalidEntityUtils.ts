import {
  copyEntity,
  notOk,
  ok,
  withAdvisoryLock,
  type AdminEntity,
  type AdminEntityCreate,
  type AdminSchemaSpecificationUpdate,
  type ErrorType,
  type PromiseResult,
  type Result,
} from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import {
  ChangeValidationsValueItemWithoutValidationsUpdate,
  ChangeValidationsWithoutValidationsUpdate,
  IntegrationTestSchema,
} from '../IntegrationTestSchema.js';
import type { AdminChangeValidations, AdminValueItems, AppAdminClient } from '../SchemaTypes.js';
import { CHANGE_VALIDATIONS_CREATE, VALUE_ITEMS_CREATE } from './Fixtures.js';

interface Options {
  publish?: boolean;
}

export async function createInvalidEntity(
  server: Server,
  adminClient: AppAdminClient,
  fields: Partial<AdminChangeValidations['fields']>,
  options?: Options,
) {
  return doCreateInvalidEntity<AdminChangeValidations>(
    server,
    adminClient,
    ChangeValidationsWithoutValidationsUpdate,
    copyEntity(CHANGE_VALIDATIONS_CREATE, { fields }),
    options,
  );
}

export async function createEntityWithInvalidValueItem(
  server: Server,
  adminClient: AppAdminClient,
  options?: Options,
) {
  return doCreateInvalidEntity<AdminValueItems>(
    server,
    adminClient,
    ChangeValidationsValueItemWithoutValidationsUpdate,
    copyEntity(VALUE_ITEMS_CREATE, {
      fields: { any: { type: 'ChangeValidationsValueItem', matchPattern: 'no match' } },
    }),
    options,
  );
}

async function doCreateInvalidEntity<TEntity extends AdminEntity<string, object> = AdminEntity>(
  server: Server,
  adminClient: AppAdminClient,
  schemaUpdate: AdminSchemaSpecificationUpdate,
  entity: AdminEntityCreate<TEntity>,
  options?: Options,
): PromiseResult<
  {
    entity: TEntity;
    validations: { id: string; valid: boolean; validPublished: boolean | null }[];
  },
  | typeof ErrorType.BadRequest
  | typeof ErrorType.Conflict
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  let result: Result<
    {
      entity: TEntity;
      validations: { id: string; valid: boolean; validPublished: boolean | null }[];
    },
    | typeof ErrorType.BadRequest
    | typeof ErrorType.Conflict
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  > = notOk.Generic('not set');
  const schemaResult = await withTemporarySchemaChange(
    server,
    adminClient,
    schemaUpdate,
    async () => {
      const createResult = await adminClient.createEntity<TEntity>(entity, {
        publish: options?.publish,
      });
      result = createResult.isError()
        ? createResult
        : ok({ entity: createResult.value.entity, validations: [] });
    },
    (processed) => {
      if (result.isOk() && result.value.entity.id === processed.id) {
        result.value.validations.push(processed);
      }
    },
  );
  if (schemaResult.isError()) return schemaResult;

  return result;
}

async function withTemporarySchemaChange(
  server: Server,
  adminClient: AppAdminClient,
  schemaUpdate: AdminSchemaSpecificationUpdate,
  onChangedSchema: () => Promise<void>,
  onProcessed: (processed: { id: string; valid: boolean; validPublished: boolean | null }) => void,
): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return await withAdvisoryLock(
    adminClient,
    'schema-update',
    { acquireInterval: 50, leaseDuration: 300, renewInterval: 200 },
    async () => {
      // remove validations from the schema
      const removeValidationsResult = await adminClient.updateSchemaSpecification(schemaUpdate);
      if (removeValidationsResult.isError()) return removeValidationsResult;

      await onChangedSchema();

      // restore validations to the schema
      const restoreSchemaResult = await adminClient.updateSchemaSpecification(
        IntegrationTestSchema,
      );
      if (restoreSchemaResult.isError()) return restoreSchemaResult;

      // validate

      let done = false;
      while (!done) {
        const processResult = await server.processNextDirtyEntity();
        if (processResult.isError()) return processResult;
        if (processResult.value) {
          onProcessed(processResult.value);
        } else {
          done = true;
        }
      }
      return ok(undefined);
    },
  );
}
