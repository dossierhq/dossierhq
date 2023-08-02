import {
  AdminSchemaWithMigrations,
  ErrorType,
  notOk,
  ok,
  type AdminSchemaSpecificationUpdate,
  type AdminSchemaSpecificationWithMigrations,
  type PromiseResult,
  type SchemaSpecificationUpdatePayload,
} from '@dossierhq/core';
import type { DatabaseAdapter, TransactionContext } from '@dossierhq/database-adapter';
import { calculateSchemaChangeImpact } from './calculateSchemaChangeImpact.js';
import { schemaGetSpecification } from './schemaGetSpecification.js';

export async function schemaUpdateSpecification(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  update: AdminSchemaSpecificationUpdate,
): PromiseResult<
  SchemaSpecificationUpdatePayload<AdminSchemaSpecificationWithMigrations>,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  return await context.withTransaction<
    SchemaSpecificationUpdatePayload<AdminSchemaSpecificationWithMigrations>,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >(async (context) => {
    const { logger } = context;
    const previousSpecificationResult = await schemaGetSpecification(
      databaseAdapter,
      context,
      false,
    );
    if (previousSpecificationResult.isError()) return previousSpecificationResult;

    // Check version if specified
    if (
      typeof update.version === 'number' &&
      update.version !== previousSpecificationResult.value.version + 1
    ) {
      return notOk.BadRequest(
        `Expected version ${previousSpecificationResult.value.version + 1}, got ${update.version}`,
      );
      //TODO how to handle if wrong version, but the update creates an identical spec? (e.g. making the exact same update twice)
    }

    // Merge update into previous schema
    const oldSchema = new AdminSchemaWithMigrations(previousSpecificationResult.value);
    const mergeResult = oldSchema.updateAndValidate(update);
    if (mergeResult.isError()) return mergeResult;
    const newSchema = mergeResult.value;

    if (newSchema === oldSchema) {
      return ok({ effect: 'none', schemaSpecification: newSchema.spec });
    }

    // Calculate impact of schema change
    const impactResult = calculateSchemaChangeImpact(oldSchema, newSchema);
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
    const updateResult = await databaseAdapter.schemaUpdateSpecification(context, newSchema.spec);
    if (updateResult.isError()) {
      if (updateResult.isErrorType(ErrorType.Conflict)) {
        if (typeof update.version === 'number') {
          return notOk.BadRequest(`Expected version ${update.version + 1}, got ${update.version}`);
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

    return ok({ effect: 'updated', schemaSpecification: newSchema.spec });
  });
}
