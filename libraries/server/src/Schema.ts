import type { PromiseResult, ErrorType } from '@jonasb/datadata-core';
import { ok, Schema } from '@jonasb/datadata-core';
import type { Context, SessionContext } from '.';
import * as Db from './Database';
import type { SchemaVersionsTable } from './DatabaseTables';

export async function getSchema(context: Context): PromiseResult<Schema, ErrorType.Generic> {
  const result = await Db.queryNoneOrOne<Pick<SchemaVersionsTable, 'specification'>>(
    context,
    'SELECT specification FROM schema_versions ORDER BY id DESC LIMIT 1'
  );
  if (!result) {
    return ok(Schema.empty());
  }
  const { specification } = result;
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
