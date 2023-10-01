import { ErrorType, notOk, ok, type PromiseResult } from '@dossierhq/core';
import {
  buildPostgresSqlQuery,
  type DatabaseAuthCreatePrincipalPayload,
  type DatabaseAuthSyncPrincipal,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { SubjectsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNoneOrOne } from '../QueryFunctions.js';
import { createPrincipal, getOrCreateSubject } from './createSession.js';

export async function authCreatePrincipal(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  principal: DatabaseAuthSyncPrincipal,
): PromiseResult<
  DatabaseAuthCreatePrincipalPayload,
  typeof ErrorType.Conflict | typeof ErrorType.Generic
> {
  const getExistingResult = await queryNoneOrOne<Pick<SubjectsTable, 'uuid'>>(
    database,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      sql`SELECT s.uuid FROM subjects s, principals p WHERE p.provider = ${principal.provider} AND`;
      sql`p.identifier = ${principal.identifier} AND p.subjects_id = s.id`;
    }),
  );
  if (getExistingResult.isError()) return getExistingResult;

  if (getExistingResult.value) {
    const { uuid } = getExistingResult.value;
    if (uuid !== principal.subjectId) {
      return notOk.Conflict('Principal already exists with different subject');
    }
    return ok({ effect: 'none' });
  }

  return await context.withTransaction(async (context) => {
    const subjectResult = await getOrCreateSubject(database, context, {
      subjectId: principal.subjectId,
    });
    if (subjectResult.isError()) return subjectResult;
    const { id } = subjectResult.value;

    const createResult = await createPrincipal(
      database,
      context,
      principal.provider,
      principal.identifier,
      id,
    );
    if (createResult.isError()) {
      if (createResult.error === ErrorType.Generic) {
        return notOk.Generic(createResult.message); // cast
      }
      return notOk.GenericUnexpectedError(createResult);
    }

    return ok({ effect: 'created' });
  });
}
