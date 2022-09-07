import type {
  AdminSchemaSpecification,
  AdminSchemaSpecificationUpdate,
  ErrorType,
  PromiseResult,
  SchemaSpecificationUpdatePayload,
} from '@jonasb/datadata-core';
import { AdminSchema, ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter, TransactionContext } from '@jonasb/datadata-database-adapter';

export async function getSchemaSpecification(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext
): PromiseResult<AdminSchemaSpecification, typeof ErrorType.Generic> {
  const { logger } = context;
  logger.info('Loading schema');
  const result = await databaseAdapter.schemaGetSpecification(context);
  if (result.isError()) return result;

  const specification = result.value;
  if (!specification) {
    logger.info('No schema set, defaulting to empty');
    return ok({ entityTypes: [], valueTypes: [], patterns: [] });
  }

  // Handle old schema format which lacked patterns
  if (!specification.patterns) specification.patterns = [];

  logger.info(
    'Loaded schema with %d entity types, %d value types, %d patterns',
    specification.entityTypes.length,
    specification.valueTypes.length,
    specification.patterns.length
  );
  return ok(specification);
}

export async function updateSchemaSpecification(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  schemaSpec: AdminSchemaSpecificationUpdate
): PromiseResult<
  SchemaSpecificationUpdatePayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  return await context.withTransaction(async (context) => {
    const previousSpecificationResult = await getSchemaSpecification(databaseAdapter, context);
    if (previousSpecificationResult.isError()) return previousSpecificationResult;

    const oldSchema = new AdminSchema(previousSpecificationResult.value);
    const mergeResult = oldSchema.mergeWith(schemaSpec);
    if (mergeResult.isError()) return mergeResult;
    const newSchema = mergeResult.value;

    // TODO return with 'none' if same as previous schema
    const updateResult = await databaseAdapter.schemaUpdateSpecification(context, newSchema.spec);
    if (updateResult.isError()) return updateResult;

    return ok({ effect: 'updated', schemaSpecification: newSchema.spec });
  });
}
