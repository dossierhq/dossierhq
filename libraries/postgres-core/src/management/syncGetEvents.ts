import { notOk, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  type DatabaseManagementSyncGetEventsPayload,
  type DatabaseManagementSyncGetEventsQuery,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';

export function managementSyncGetEvents(
  _database: PostgresDatabaseAdapter,
  _context: TransactionContext,
  _query: DatabaseManagementSyncGetEventsQuery,
): PromiseResult<
  DatabaseManagementSyncGetEventsPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  return Promise.resolve(notOk.BadRequest('Not implemented'));
}
