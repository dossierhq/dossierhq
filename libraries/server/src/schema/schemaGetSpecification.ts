import {
  ok,
  type ErrorType,
  type PromiseResult,
  type SchemaSpecificationWithMigrations,
} from '@dossierhq/core';
import type { DatabaseAdapter, TransactionContext } from '@dossierhq/database-adapter';
import { modernizeSchemaSpecification } from './SchemaModernizer.js';

export async function schemaGetSpecification(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  initialLoad: boolean,
): PromiseResult<SchemaSpecificationWithMigrations, typeof ErrorType.Generic> {
  const { logger } = context;
  if (initialLoad) logger.info('Loading schema');
  const result = await databaseAdapter.schemaGetSpecification(context);
  if (result.isError()) return result;

  const storedSpecification = result.value;
  if (!storedSpecification) {
    if (initialLoad) logger.info('No schema set, defaulting to empty');
    return ok({
      schemaKind: 'full',
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
      `Loaded schema with ${payload.entityTypes.length} entity types, ${payload.componentTypes.length} component types, ${payload.patterns.length} patterns, ${payload.indexes.length} indexes`,
    );
  }
  return ok(payload);
}
