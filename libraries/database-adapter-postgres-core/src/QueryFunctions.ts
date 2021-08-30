import { ErrorType, notOk, ok, PromiseResult } from '@jonasb/datadata-core';
import type { Context } from '@jonasb/datadata-server';
import type { PostgresDatabaseAdapter } from '.';

export async function queryNone(
  context: Context,
  adapter: PostgresDatabaseAdapter,
  query: string,
  values?: unknown[]
): PromiseResult<void, ErrorType.Generic> {
  const rows = await adapter.query(context.transaction, query, values);
  if (rows.length !== 0) {
    return notOk.Generic(`Expected 0 rows, got ${rows.length}`);
  }
  return ok(undefined);
}

export async function queryOne<R>(
  context: Context,
  adapter: PostgresDatabaseAdapter,
  query: string,
  values?: unknown[]
): PromiseResult<R, ErrorType.Generic> {
  const rows = await adapter.query<R>(context.transaction, query, values);
  if (rows.length !== 1) {
    return notOk.Generic(`Expected 1 row, got ${rows.length}`);
  }
  return ok(rows[0]);
}
