import type { Context } from '.';

export class UnexpectedQuantityError extends Error {
  readonly actual: number;

  constructor(message: string, actual: number) {
    super(message);
    this.name = 'UnexpectedQuantityError';
    this.actual = actual;
  }
}

interface QueryConfig {
  text: string;
  values: unknown[];
}

function normalizeQueryArguments(
  queryTextOrConfig: string | QueryConfig,
  values?: unknown[]
): [string, unknown[] | undefined] {
  if (typeof queryTextOrConfig === 'string') {
    return [queryTextOrConfig, values];
  }
  return [queryTextOrConfig.text, queryTextOrConfig.values];
}

export function isUniqueViolationOfConstraint(
  context: Context,
  error: unknown,
  constraintName: string
): boolean {
  return context.databaseAdapter.isUniqueViolationOfConstraint(error, constraintName);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryNone<I extends any[] = any[]>(
  context: Context,
  queryTextOrConfig: string | QueryConfig,
  values?: I
): Promise<void> {
  const [queryText, queryValues] = normalizeQueryArguments(queryTextOrConfig, values);
  const rows = await context.databaseAdapter.queryLegacy(
    context.transaction,
    queryText,
    queryValues
  );
  if (!rows || rows.length === 0) {
    return;
  }
  throw new UnexpectedQuantityError(`Expected 0 rows, got ${rows.length}`, rows.length);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryNoneOrOne<R = any, I extends any[] = any[]>(
  context: Context,
  queryTextOrConfig: string | QueryConfig,
  values?: I
): Promise<R | null> {
  const [queryText, queryValues] = normalizeQueryArguments(queryTextOrConfig, values);
  const rows = await context.databaseAdapter.queryLegacy<R>(
    context.transaction,
    queryText,
    queryValues
  );

  if (rows.length === 0) {
    return null;
  }
  if (rows.length !== 1) {
    throw new UnexpectedQuantityError(`Expected 0 or 1 row, got ${rows.length}`, rows.length);
  }
  return rows[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryOne<R, I extends any[] = any[]>(
  context: Context,
  queryTextOrConfig: string | QueryConfig,
  values?: I
): Promise<R> {
  const [queryText, queryValues] = normalizeQueryArguments(queryTextOrConfig, values);
  const rows = await context.databaseAdapter.queryLegacy<R>(
    context.transaction,
    queryText,
    queryValues
  );
  if (rows.length !== 1) {
    throw new UnexpectedQuantityError(`Expected 1 row, got ${rows.length}`, rows.length);
  }
  return rows[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryMany<R, I extends any[] = any[]>(
  context: Context,
  queryTextOrConfig: string | QueryConfig,
  values?: I
): Promise<R[]> {
  const [queryText, queryValues] = normalizeQueryArguments(queryTextOrConfig, values);
  const rows = await context.databaseAdapter.queryLegacy<R>(
    context.transaction,
    queryText,
    queryValues
  );
  return rows;
}
