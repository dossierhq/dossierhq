import {
  copyEntity,
  notOk,
  ok,
  type AdminEntity,
  type AdminEntityCreate,
  type AdminSchemaSpecificationUpdate,
  type EntityReference,
  type ErrorType,
  type PromiseResult,
  type Result,
} from '@dossierhq/core';
import type { ProcessDirtyEntityPayload, Server } from '@dossierhq/server';
import {
  ChangeValidationsComponentWithoutValidationsUpdate,
  ChangeValidationsWithoutValidationsUpdate,
  IntegrationTestSchema,
} from '../IntegrationTestSchema.js';
import type { AdminChangeValidations, AdminComponents, AppAdminClient } from '../SchemaTypes.js';
import { CHANGE_VALIDATIONS_CREATE, VALUE_ITEMS_CREATE } from './Fixtures.js';
import { processAllDirtyEntities, withSchemaAdvisoryLock } from './SchemaTestUtils.js';

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

export async function createEntityWithInvalidComponent(
  server: Server,
  adminClient: AppAdminClient,
  options?: Options,
) {
  return doCreateInvalidEntity<AdminComponents>(
    server,
    adminClient,
    ChangeValidationsComponentWithoutValidationsUpdate,
    copyEntity(VALUE_ITEMS_CREATE, {
      fields: { any: { type: 'ChangeValidationsComponent', matchPattern: 'no match' } },
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
    validations: ProcessDirtyEntityPayload[];
  },
  | typeof ErrorType.BadRequest
  | typeof ErrorType.Conflict
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  let result: Result<
    { entity: TEntity; validations: ProcessDirtyEntityPayload[] },
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
      return createResult.isOk() ? { id: createResult.value.entity.id } : undefined;
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
  onChangedSchema: () => Promise<EntityReference | undefined>,
  onProcessed: (processed: ProcessDirtyEntityPayload) => void,
): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return await withSchemaAdvisoryLock(adminClient, async () => {
    // remove validations from the schema
    const removeValidationsResult = await adminClient.updateSchemaSpecification(schemaUpdate);
    if (removeValidationsResult.isError()) return removeValidationsResult;

    const filter = await onChangedSchema();

    // restore validations to the schema
    const restoreSchemaResult = await adminClient.updateSchemaSpecification(IntegrationTestSchema);
    if (restoreSchemaResult.isError()) return restoreSchemaResult;

    // process dirty
    return processAllDirtyEntities(server, filter, onProcessed);
  });
}
