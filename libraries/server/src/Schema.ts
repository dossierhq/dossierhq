import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok, Schema } from '@jonasb/datadata-core';
import type { DatabaseAdapter, SessionContext, TransactionContext } from '.';
import * as Db from './Database';

export async function getSchema(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext
): PromiseResult<Schema, ErrorType.Generic> {
  const { logger } = context;
  logger.info('Loading schema');
  const result = await databaseAdapter.schemaGet(context);
  if (result.isError()) {
    return result;
  }

  const specification = result.value;
  if (!specification) {
    logger.info('No schema set, defaulting to empty');
    return ok(Schema.empty());
  }
  logger.info(
    'Loaded schema with %d entity types and  %d value types',
    specification.entityTypes.length,
    specification.valueTypes.length
  );
  return ok(new Schema(specification));
}

export async function setSchema(
  context: SessionContext,
  schema: Schema
): PromiseResult<void, ErrorType.BadRequest> {
  const validation = schema.validate();
  if (validation.isError()) {
    return validation;
  }
  // TODO check if different
  await Db.queryNone(context, 'INSERT INTO schema_versions (specification) VALUES ($1)', [
    schema.spec,
  ]);
  return ok(undefined);
}
