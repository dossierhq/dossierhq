import type {
  ErrorType,
  PromiseResult,
  AdminSchemaSpecification,
  AdminSchemaSpecificationUpdate,
  SchemaSpecificationUpdatePayload,
} from '@jonasb/datadata-core';
import { ok, Schema } from '@jonasb/datadata-core';
import type { DatabaseAdapter, TransactionContext } from '.';

export async function getSchemaSpecification(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext
): PromiseResult<AdminSchemaSpecification, ErrorType.Generic> {
  const { logger } = context;
  logger.info('Loading schema');
  const result = await databaseAdapter.schemaGetSpecification(context);
  if (result.isError()) {
    return result;
  }

  const specification = result.value;
  if (!specification) {
    logger.info('No schema set, defaulting to empty');
    return ok({ entityTypes: [], valueTypes: [] });
  }
  logger.info(
    'Loaded schema with %d entity types and  %d value types',
    specification.entityTypes.length,
    specification.valueTypes.length
  );
  return ok(specification);
}

export async function updateSchemaSpecification(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  schemaSpec: AdminSchemaSpecificationUpdate
): PromiseResult<SchemaSpecificationUpdatePayload, ErrorType.BadRequest | ErrorType.Generic> {
  return await context.withTransaction(async (context) => {
    const previousSpecificationResult = await getSchemaSpecification(databaseAdapter, context);
    if (previousSpecificationResult.isError()) {
      return previousSpecificationResult;
    }
    const schema = new Schema(previousSpecificationResult.value);
    const mergeResult = schema.mergeWith(schemaSpec);
    if (mergeResult.isError()) {
      return mergeResult;
    }
    const schemaSpecification = mergeResult.value;
    // TODO return with 'none' if same as previous schema
    const updateResult = await databaseAdapter.schemaUpdateSpecification(
      context,
      schemaSpecification
    );
    if (updateResult.isError()) {
      return updateResult;
    }
    return ok({ effect: 'updated', schemaSpecification });
  });
}
