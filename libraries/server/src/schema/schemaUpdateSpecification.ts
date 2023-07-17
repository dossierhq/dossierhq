import {
  AdminSchema,
  ok,
  type AdminSchemaSpecificationUpdate,
  type ErrorType,
  type PromiseResult,
  type SchemaSpecificationUpdatePayload,
} from '@dossierhq/core';
import type { DatabaseAdapter, TransactionContext } from '@dossierhq/database-adapter';
import { calculateSchemaChangeEntityValidation } from './calculateSchemaChangeEntityValidation.js';
import { schemaGetSpecification } from './schemaGetSpecification.js';

export async function schemaUpdateSpecification(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  schemaSpec: AdminSchemaSpecificationUpdate,
): PromiseResult<
  SchemaSpecificationUpdatePayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  return await context.withTransaction<
    SchemaSpecificationUpdatePayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >(async (context) => {
    const { logger } = context;
    const previousSpecificationResult = await schemaGetSpecification(
      databaseAdapter,
      context,
      false,
    );
    if (previousSpecificationResult.isError()) return previousSpecificationResult;

    const oldSchema = new AdminSchema(previousSpecificationResult.value);
    const mergeResult = oldSchema.updateAndValidate(schemaSpec);
    if (mergeResult.isError()) return mergeResult;
    const newSchema = mergeResult.value;

    if (newSchema === oldSchema) {
      return ok({ effect: 'none', schemaSpecification: newSchema.spec });
    }

    const validationCalculationResult = calculateSchemaChangeEntityValidation(oldSchema, newSchema);
    if (validationCalculationResult.isError()) return validationCalculationResult;

    const updateResult = await databaseAdapter.schemaUpdateSpecification(context, newSchema.spec);
    if (updateResult.isError()) return updateResult;

    if (
      validationCalculationResult.value.entityTypes.length > 0 ||
      validationCalculationResult.value.valueTypes.length > 0
    ) {
      logger.info(
        'Marking entities with for validation (entity types=%s, value types=%s)',
        validationCalculationResult.value.entityTypes.join(','),
        validationCalculationResult.value.valueTypes.join(','),
      );
      const markDirtyResult = await databaseAdapter.managementDirtyMarkEntities(
        context,
        validationCalculationResult.value.entityTypes,
        validationCalculationResult.value.valueTypes,
      );
      if (markDirtyResult.isError()) return markDirtyResult;

      logger.info('Marked %d entities for validation', markDirtyResult.value.count);
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
