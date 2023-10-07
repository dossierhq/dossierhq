import {
  ok,
  type AdminSchemaSpecificationWithMigrations,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { DatabaseAdapter, TransactionContext } from '@dossierhq/database-adapter';
import { modernizeSchemaSpecification } from './SchemaModernizer.js';

export async function schemaGetSpecification(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  initialLoad: boolean,
): PromiseResult<AdminSchemaSpecificationWithMigrations, typeof ErrorType.Generic> {
  const { logger } = context;
  if (initialLoad) logger.info('Loading schema');
  const result = await databaseAdapter.schemaGetSpecification(context);
  if (result.isError()) return result;

  const storedSpecification = result.value;
  if (!storedSpecification) {
    if (initialLoad) logger.info('No schema set, defaulting to empty');
    return ok({
      schemaKind: 'admin',
      version: 0,
      entityTypes: [],
      componentTypes: [],
      patterns: [],
      indexes: [],
      migrations: [],
    });
  }

  const payload = modernizeSchemaSpecification(storedSpecification);

  if (initialLoad) {
    logger.info(
      'Loaded schema with %d entity types, %d component types, %d patterns, %d indexes',
      payload.entityTypes.length,
      payload.componentTypes.length,
      payload.patterns.length,
      payload.indexes.length,
    );
  }
  return ok(payload);
}
