import {
  copyEntity,
  notOk,
  ok,
  type Entity,
  type EntityCreate,
  type EntityProcessDirtyPayload,
  type EntityReference,
  type ErrorType,
  type PromiseResult,
  type Result,
  type SchemaSpecificationUpdate,
} from '@dossierhq/core';
import {
  ChangeValidationsComponentWithoutValidationsUpdate,
  ChangeValidationsWithoutValidationsUpdate,
  IntegrationTestSchema,
} from '../IntegrationTestSchema.js';
import type { AppDossierClient, ChangeValidations, Components } from '../SchemaTypes.js';
import { CHANGE_VALIDATIONS_CREATE, VALUE_ITEMS_CREATE } from './Fixtures.js';
import { withSchemaAdvisoryLock } from './SchemaTestUtils.js';

interface Options {
  publish?: boolean;
}

export async function createInvalidEntity(
  client: AppDossierClient,
  fields: Partial<ChangeValidations['fields']>,
  options?: Options,
): PromiseResult<
  { entity: ChangeValidations; validations: EntityProcessDirtyPayload[] },
  | typeof ErrorType.BadRequest
  | typeof ErrorType.Conflict
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  return doCreateInvalidEntity<ChangeValidations>(
    client,
    ChangeValidationsWithoutValidationsUpdate,
    copyEntity(CHANGE_VALIDATIONS_CREATE, { fields }),
    options,
  );
}

export async function createEntityWithInvalidComponent(
  client: AppDossierClient,
  options?: Options,
): PromiseResult<
  { entity: Components; validations: EntityProcessDirtyPayload[] },
  | typeof ErrorType.BadRequest
  | typeof ErrorType.Conflict
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  return doCreateInvalidEntity<Components>(
    client,
    ChangeValidationsComponentWithoutValidationsUpdate,
    copyEntity(VALUE_ITEMS_CREATE, {
      fields: { any: { type: 'ChangeValidationsComponent', matchPattern: 'no match' } },
    }),
    options,
  );
}

async function doCreateInvalidEntity<TEntity extends Entity<string, object> = Entity>(
  client: AppDossierClient,
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
    client,
    schemaUpdate,
    async () => {
      const createResult = await client.createEntity<TEntity>(entity, {
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
  client: AppDossierClient,
  schemaUpdate: SchemaSpecificationUpdate,
  onChangedSchema: () => Promise<EntityReference | undefined>,
  onProcessed: (processed: EntityProcessDirtyPayload) => void,
): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return await withSchemaAdvisoryLock(client, async () => {
    // remove validations from the schema
    const removeValidationsResult = await client.updateSchemaSpecification(schemaUpdate);
    if (removeValidationsResult.isError()) return removeValidationsResult;

    const filter = await onChangedSchema();

    // restore validations to the schema
    const restoreSchemaResult = await client.updateSchemaSpecification(IntegrationTestSchema);
    if (restoreSchemaResult.isError()) return restoreSchemaResult;

    // process dirty
    if (filter) {
      const processResult = await client.processDirtyEntity(filter);
      if (processResult.isError()) return processResult;

      if (processResult.value) {
        onProcessed(processResult.value);
      }
    }

    return ok(undefined);
  });
}
