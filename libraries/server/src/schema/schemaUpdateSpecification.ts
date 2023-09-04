import {
  AdminSchemaWithMigrations,
  ErrorType,
  isFieldValueEqual,
  notOk,
  ok,
  type AdminSchemaSpecificationUpdate,
  type AdminSchemaSpecificationWithMigrations,
  type AdminSchemaTransientMigrationAction,
  type PromiseResult,
  type SchemaSpecificationUpdatePayload,
  type UpdateSchemaSyncEvent,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { SessionContext } from '../Context.js';
import { calculateSchemaChangeImpact } from './calculateSchemaChangeImpact.js';
import { schemaGetSpecification } from './schemaGetSpecification.js';

export async function schemaUpdateSpecification(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  update: AdminSchemaSpecificationUpdate,
): PromiseResult<
  SchemaSpecificationUpdatePayload<AdminSchemaSpecificationWithMigrations>,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  return await context.withTransaction<
    SchemaSpecificationUpdatePayload<AdminSchemaSpecificationWithMigrations>,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >(async (context) => {
    const previousSpecificationResult = await schemaGetSpecification(
      databaseAdapter,
      context,
      false,
    );
    if (previousSpecificationResult.isError()) return previousSpecificationResult;
    const previousSchemaSpec = previousSpecificationResult.value;

    // Check version if specified
    if (typeof update.version === 'number' && update.version !== previousSchemaSpec.version + 1) {
      return notOk.BadRequest(
        `Expected version ${previousSchemaSpec.version + 1}, got ${update.version}`,
      );
      //TODO how to handle if wrong version, but the update creates an identical spec? (e.g. making the exact same update twice)
    }

    // Merge update into previous schema
    const previousSchema = new AdminSchemaWithMigrations(previousSchemaSpec);
    const mergeResult = previousSchema.updateAndValidate(update);
    if (mergeResult.isError()) return mergeResult;
    const newSchema = mergeResult.value;

    if (newSchema === previousSchema) {
      return ok({ effect: 'none', schemaSpecification: newSchema.spec });
    }

    // Calculate impact of schema change and update schema spec
    const updateResult = await calculateAndUpdateSchemaSpec(
      databaseAdapter,
      context,
      previousSchema,
      newSchema,
      update.version ?? null,
      update.transientMigrations ?? null,
      null,
    );
    if (updateResult.isError()) return updateResult;

    return ok({ effect: 'updated', schemaSpecification: newSchema.spec });
  });
}

export async function schemaUpdateSpecificationSyncAction(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  event: UpdateSchemaSyncEvent,
): PromiseResult<
  AdminSchemaWithMigrations,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const previousSpecificationResult = await schemaGetSpecification(databaseAdapter, context, false);
  if (previousSpecificationResult.isError()) return previousSpecificationResult;
  const previousSchemaSpec = previousSpecificationResult.value;

  if (previousSchemaSpec.version + 1 !== event.schemaSpecification.version) {
    return notOk.BadRequest(
      `Expected version ${previousSchemaSpec.version + 1}, got ${
        event.schemaSpecification.version
      }`,
    );
  }

  // We should be good here, but let's double check that applying the new schema to the old produces the same result
  // Merge update into previous schema
  const oldSchema = new AdminSchemaWithMigrations(previousSchemaSpec);
  const mergeResult = oldSchema.updateAndValidate(event.schemaSpecification);
  if (mergeResult.isError()) return mergeResult;
  const newSchema = mergeResult.value;

  if (!isFieldValueEqual(newSchema.spec, event.schemaSpecification)) {
    return notOk.BadRequest(
      'The new schema merged with the existing schema differs from what was expected',
    );
  }

  // Calculate impact of schema change and update schema spec
  const updateResult = await calculateAndUpdateSchemaSpec(
    databaseAdapter,
    context,
    oldSchema,
    newSchema,
    event.schemaSpecification.version,
    null, // no transient migrations in sync events
    event,
  );
  if (updateResult.isError()) return updateResult;

  return ok(newSchema);
}

async function calculateAndUpdateSchemaSpec(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  oldSchema: AdminSchemaWithMigrations,
  newSchema: AdminSchemaWithMigrations,
  specifiedVersion: number | null,
  transientMigrations: AdminSchemaTransientMigrationAction[] | null,
  syncEvent: UpdateSchemaSyncEvent | null,
): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const { logger } = context;

  // Calculate impact of schema change
  const impactResult = calculateSchemaChangeImpact(oldSchema, newSchema, transientMigrations);
  if (impactResult.isError()) return impactResult;
  const { dirtyEntitiesSelector } = impactResult.value;

  // Ensure there are no entities of deleted entity types
  if (impactResult.value.deleteEntityTypes.length > 0) {
    const countEntitiesResult = await databaseAdapter.schemaUpdateCountEntitiesWithTypes(
      context,
      impactResult.value.deleteEntityTypes,
    );
    if (countEntitiesResult.isError()) return countEntitiesResult;

    if (countEntitiesResult.value > 0) {
      return notOk.BadRequest(
        `Cannot delete entity types with ${
          countEntitiesResult.value
        } existing entities: ${impactResult.value.deleteEntityTypes.join(', ')}`,
      );
    }
  }

  // Update the schema spec
  const updateResult = await databaseAdapter.schemaUpdateSpecification(
    context,
    context.session,
    newSchema.spec,
    syncEvent,
  );
  if (updateResult.isError()) {
    if (updateResult.isErrorType(ErrorType.Conflict)) {
      if (specifiedVersion !== null) {
        return notOk.BadRequest(
          `Expected version ${specifiedVersion + 1}, got ${specifiedVersion}`,
        );
      }
      return notOk.BadRequest('Schema was edited concurrently, try again');
    }
    return notOk.Generic(updateResult.message);
  }

  // Rename types
  const renameTypesResult = await databaseAdapter.schemaUpdateRenameTypes(
    context,
    impactResult.value.renameEntityTypes,
    impactResult.value.renameValueTypes,
  );
  if (renameTypesResult.isError()) return renameTypesResult;

  // Update unique indexes
  const modifyIndexesResult = await databaseAdapter.schemaUpdateModifyIndexes(
    context,
    impactResult.value.deleteUniqueValueIndexes,
    impactResult.value.renameUniqueValueIndexes,
  );
  if (modifyIndexesResult.isError()) return modifyIndexesResult;

  // Mark entities as dirty
  if (dirtyEntitiesSelector) {
    const selectorLogString = Object.entries(
      dirtyEntitiesSelector as unknown as Record<string, string[]>,
    )
      .filter(([_selector, types]) => types.length > 0)
      .map(([selector, types]) => `${selector}=${types.join(',')}`)
      .join(', ');
    logger.info('Marking entities as dirty (%s)', selectorLogString);
    const markDirtyResult = await databaseAdapter.managementDirtyMarkEntities(
      context,
      dirtyEntitiesSelector,
    );
    if (markDirtyResult.isError()) return markDirtyResult;

    logger.info(
      'Marked entities as dirty (validate=%d, index=%d)',
      markDirtyResult.value.validationCount,
      markDirtyResult.value.indexCount,
    );
  }

  // Delete value types from indexes
  const deleteValueTypesResult = await databaseAdapter.schemaUpdateDeleteValueTypesFromIndexes(
    context,
    impactResult.value.deleteValueTypes,
  );
  if (deleteValueTypesResult.isError()) return deleteValueTypesResult;

  logger.info(
    'Updated schema, new schema has %d entity types, %d value types, %d patterns, %d indexes',
    newSchema.spec.entityTypes.length,
    newSchema.spec.valueTypes.length,
    newSchema.spec.patterns.length,
    newSchema.spec.indexes.length,
  );

  return ok(undefined);
}
