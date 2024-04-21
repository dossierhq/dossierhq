import {
  copyEntity,
  notOk,
  ok,
  type Entity,
  type EntityCreate,
  type EntityProcessDirtyPayload,
  type SchemaSpecificationUpdate,
  type EntityReference,
  type ErrorType,
  type PromiseResult,
  type Result,
} from '@dossierhq/core';
import {
  ChangeValidationsComponentWithoutValidationsUpdate,
  ChangeValidationsWithoutValidationsUpdate,
  IntegrationTestSchema,
} from '../IntegrationTestSchema.js';
import type { ChangeValidations, Components, AppAdminClient } from '../SchemaTypes.js';
import { CHANGE_VALIDATIONS_CREATE, VALUE_ITEMS_CREATE } from './Fixtures.js';
import { withSchemaAdvisoryLock } from './SchemaTestUtils.js';

interface Options {
  publish?: boolean;
}

export async function createInvalidEntity(
  adminClient: AppAdminClient,
  fields: Partial<ChangeValidations['fields']>,
  options?: Options,
) {
  return doCreateInvalidEntity<ChangeValidations>(
    adminClient,
    ChangeValidationsWithoutValidationsUpdate,
    copyEntity(CHANGE_VALIDATIONS_CREATE, { fields }),
    options,
  );
}

export async function createEntityWithInvalidComponent(
  adminClient: AppAdminClient,
  options?: Options,
) {
  return doCreateInvalidEntity<Components>(
    adminClient,
    ChangeValidationsComponentWithoutValidationsUpdate,
    copyEntity(VALUE_ITEMS_CREATE, {
      fields: { any: { type: 'ChangeValidationsComponent', matchPattern: 'no match' } },
    }),
    options,
  );
}

async function doCreateInvalidEntity<TEntity extends Entity<string, object> = Entity>(
  adminClient: AppAdminClient,
  schemaUpdate: SchemaSpecificationUpdate,
  entity: EntityCreate<TEntity>,
  options?: Options,
): PromiseResult<
  {
    entity: TEntity;
    validations: EntityProcessDirtyPayload[];
  },
  | typeof ErrorType.BadRequest
  | typeof ErrorType.Conflict
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  let result: Result<
    { entity: TEntity; validations: EntityProcessDirtyPayload[] },
    | typeof ErrorType.BadRequest
    | typeof ErrorType.Conflict
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  > = notOk.Generic('not set');
  const schemaResult = await withTemporarySchemaChange(
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
  adminClient: AppAdminClient,
  schemaUpdate: SchemaSpecificationUpdate,
  onChangedSchema: () => Promise<EntityReference | undefined>,
  onProcessed: (processed: EntityProcessDirtyPayload) => void,
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
    if (filter) {
      const processResult = await adminClient.processDirtyEntity(filter);
      if (processResult.isError()) return processResult;

      if (processResult.value) {
        onProcessed(processResult.value);
      }
    }

    return ok(undefined);
  });
}
