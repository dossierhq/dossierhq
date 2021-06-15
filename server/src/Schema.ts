import type { PromiseResult, ErrorType } from '@datadata/core';
import { ok, Schema } from '@datadata/core';
import type { Context, SessionContext } from '.';
import * as Db from './Database';
import type { SchemaVersionsTable } from './DatabaseTables';

export async function getSchema(context: Context<unknown>): Promise<Schema> {
  const { specification } = await Db.queryOne<Pick<SchemaVersionsTable, 'specification'>>(
    context,
    'SELECT specification FROM schema_versions ORDER BY id DESC LIMIT 1'
  );

  return new Schema(specification);
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
