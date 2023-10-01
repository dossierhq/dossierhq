import { ok, type ErrorType, type PromiseResult, type Result } from '@dossierhq/core';
import {
  createPostgresSqlQuery,
  type DatabaseAuthGetPrincipalsPayload,
  type DatabaseAuthSyncPrincipal,
  type DatabasePagingInfo,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { PrincipalsTable, SubjectsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryMany, type QueryOrQueryAndValues } from '../QueryFunctions.js';
import { toOpaqueCursor } from '../search/OpaqueCursor.js';
import {
  addConnectionOrderByAndLimit,
  addConnectionPagingFilter,
  resolveConnectionPagingAndOrdering,
} from '../utils/ConnectionUtils.js';

export async function authGetPrincipals(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  paging: DatabasePagingInfo,
): PromiseResult<
  DatabaseAuthGetPrincipalsPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const queryResult = generateGetPrincipalsQuery(database, paging);
  if (queryResult.isError()) return queryResult;

  const connectionResult = await queryMany<PrincipalsRow>(database, context, queryResult.value);
  if (connectionResult.isError()) return connectionResult;

  const { hasMore, edges } = resolveConnectionPagingAndOrdering(paging, connectionResult.value);

  return ok({ hasMore, edges: edges.map((edge) => convertEdge(database, edge)) });
}

function convertEdge(
  database: PostgresDatabaseAdapter,
  edge: PrincipalsRow,
): DatabaseAuthSyncPrincipal & {
  cursor: string;
} {
  const cursor = toOpaqueCursor(database, 'int', edge.id);
  return {
    cursor,
    provider: edge.provider,
    identifier: edge.identifier,
    subjectId: edge.uuid,
  };
}

type PrincipalsRow = Pick<PrincipalsTable, 'id' | 'provider' | 'identifier'> &
  Pick<SubjectsTable, 'uuid'>;

function generateGetPrincipalsQuery(
  database: PostgresDatabaseAdapter,
  paging: DatabasePagingInfo,
): Result<QueryOrQueryAndValues, typeof ErrorType.BadRequest> {
  const reverse = false;
  const { sql, query } = createPostgresSqlQuery();

  sql`SELECT p.id, p.provider, p.identifier, s.uuid FROM principals p`;
  sql`JOIN subjects s ON p.subjects_id = s.id`;
  sql`WHERE`;

  const pagingFilterResult = addConnectionPagingFilter(
    database,
    sql,
    paging,
    'int',
    reverse,
    (sql) => sql`p.id`,
  );
  if (pagingFilterResult.isError()) return pagingFilterResult;

  addConnectionOrderByAndLimit(sql, paging, reverse, (sql) => sql`p.id`);

  return ok(query);
}
