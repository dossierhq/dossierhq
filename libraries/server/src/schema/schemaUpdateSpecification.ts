import {
  AdminSchemaWithMigrations,
  notOk,
  ok,
  type AdminSchemaSpecificationUpdate,
  type AdminSchemaSpecificationWithMigrations,
  type ErrorType,
  type PromiseResult,
  type SchemaSpecificationUpdatePayload,
} from '@dossierhq/core';
import type { DatabaseAdapter, TransactionContext } from '@dossierhq/database-adapter';
import { calculateSchemaChangeEntityDirtySelector } from './calculateSchemaChangeEntityDirtySelector.js';
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
    }

    const oldSchema = new AdminSchemaWithMigrations(previousSpecificationResult.value);
    const mergeResult = oldSchema.updateAndValidate(update);
    if (mergeResult.isError()) return mergeResult;
    const newSchema = mergeResult.value;

    if (newSchema === oldSchema) {
      return ok({ effect: 'none', schemaSpecification: newSchema.spec });
    }

    const dirtySelectorResult = calculateSchemaChangeEntityDirtySelector(oldSchema, newSchema);
    if (dirtySelectorResult.isError()) return dirtySelectorResult;
    const dirtyEntitiesSelector = dirtySelectorResult.value;

    const updateResult = await databaseAdapter.schemaUpdateSpecification(context, newSchema.spec);
    if (updateResult.isError()) return updateResult;

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
