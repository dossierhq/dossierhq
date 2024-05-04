import {
  ErrorType,
  notOk,
  ok,
  type CreatePrincipalSyncEvent,
  type OkResult,
  type PromiseResult,
} from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type DatabaseAuthCreateSessionPayload,
  type TransactionContext,
  type WriteSession,
} from '@dossierhq/database-adapter';
import {
  PrincipalsUniqueProviderIdentifierConstraint,
  type PrincipalsTable,
  type SubjectsTable,
} from '../DatabaseSchema.js';
import { queryNoneOrOne, queryOne, type Database } from '../QueryFunctions.js';
import { getTransactionTimestamp } from '../SqliteTransaction.js';
import { createCreatePrincipalEvent } from '../utils/EventUtils.js';
import { createSession } from '../utils/SessionUtils.js';

export async function authCreateSession(
  database: Database,
  context: TransactionContext,
  provider: string,
  identifier: string,
  readonly: boolean,
  syncEvent: CreatePrincipalSyncEvent | null,
): PromiseResult<DatabaseAuthCreateSessionPayload, typeof ErrorType.Generic> {
  if (syncEvent === null) {
    const firstGetResult = await getSubject(database, context, provider, identifier, readonly);
    if (firstGetResult.isError()) return firstGetResult;

    if (firstGetResult.value) {
      return ok(firstGetResult.value);
    }

    if (readonly) {
      return ok({ principalEffect: 'none', session: { type: 'readonly', subjectId: null } });
    }
  }

  const createResult = await createSubjectAndPrincipal(
    database,
    context,
    provider,
    identifier,
    syncEvent,
  );
  if (createResult.isOk()) {
    return createResult.map((it) => it);
  }
  if (createResult.isErrorType(ErrorType.Conflict)) {
    // this should only happen if the principal is created by another request after our first check
    const secondGetResult = await getSubject(database, context, provider, identifier, readonly);
    if (secondGetResult.isError()) return secondGetResult;

    if (secondGetResult.value) {
      return ok(secondGetResult.value);
    }
    return notOk.Generic('Failed to get session after conflict');
  }

  if (createResult.isErrorType(ErrorType.Generic)) {
    return createResult;
  }
  return notOk.GenericUnexpectedError(createResult);
}

export async function authCreateSyncSessionForSubject(
  database: Database,
  context: TransactionContext,
  subject: { subjectId: string },
): PromiseResult<WriteSession, typeof ErrorType.Generic> {
  const result = await getOrCreateSubject(database, context, subject);
  if (result.isError()) return result;

  return ok(
    createSession({
      subjectInternalId: result.value.id,
      session: { type: 'write', subjectId: subject.subjectId },
    }),
  );
}

export async function getOrCreateSubject(
  database: Database,
  context: TransactionContext,
  { subjectId }: { subjectId: string },
) {
  //TODO validate subjectID uuid format
  const now = getTransactionTimestamp(context.transaction).toISOString();

  return await queryOne<Pick<SubjectsTable, 'id'>>(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      sql`INSERT INTO subjects (uuid, created_at) VALUES (${subjectId}, ${now})`;
      // The created_at=created_at is a no-op, but it's needed for sqlite to return a row when there's a conflict (DO NOTHING returns nothing)
      sql`ON CONFLICT(uuid) DO UPDATE SET created_at = created_at RETURNING id`;
    }),
  );
}

function createPayload<TError extends ErrorType>(
  principalEffect: 'created' | 'none',
  readonly: boolean,
  { id, uuid }: Pick<SubjectsTable, 'id' | 'uuid'>,
): OkResult<DatabaseAuthCreateSessionPayload, TError> {
  const session = createSession({
    subjectInternalId: id,
    session: readonly ? { type: 'readonly', subjectId: uuid } : { type: 'write', subjectId: uuid },
  });
  return ok({ principalEffect, session });
}

async function getSubject(
  database: Database,
  context: TransactionContext,
  provider: string,
  identifier: string,
  readonly: boolean,
): PromiseResult<DatabaseAuthCreateSessionPayload | null, typeof ErrorType.Generic> {
  const result = await queryNoneOrOne<Pick<SubjectsTable, 'id' | 'uuid'>>(database, context, {
    text: `SELECT s.id, s.uuid FROM subjects s, principals p
    WHERE p.provider = ?1 AND p.identifier = ?2 AND p.subjects_id = s.id`,
    values: [provider, identifier],
  });
  if (result.isError()) return result;

  if (result.value) {
    return createPayload('none', readonly, result.value);
  }
  return ok(null);
}

async function createSubjectAndPrincipal(
  database: Database,
  context: TransactionContext,
  provider: string,
  identifier: string,
  syncEvent: CreatePrincipalSyncEvent | null,
): PromiseResult<
  DatabaseAuthCreateSessionPayload,
  typeof ErrorType.Conflict | typeof ErrorType.Generic
> {
  return await context.withTransaction(async (context) => {
    const uuid = syncEvent?.createdBy ?? database.adapter.randomUUID();
    const now = syncEvent?.createdAt ?? getTransactionTimestamp(context.transaction);
    const subjectsResult = await queryOne<Pick<SubjectsTable, 'id'>>(database, context, {
      text: 'INSERT INTO subjects (uuid, created_at) VALUES (?1, ?2) RETURNING id',
      values: [uuid, now.toISOString()],
    });
    if (subjectsResult.isError()) return subjectsResult;
    const { id } = subjectsResult.value;

    const principalResult = await createPrincipal(database, context, provider, identifier, id);
    if (principalResult.isError()) return principalResult;
    const principalId = principalResult.value.id;

    const eventResult = await createCreatePrincipalEvent(
      database,
      context,
      id,
      principalId,
      syncEvent,
    );
    if (eventResult.isError()) return eventResult;

    return createPayload('created', false, { id, uuid });
  });
}

export function createPrincipal(
  database: Database,
  context: TransactionContext,
  provider: string,
  identifier: string,
  subjectInternalId: number,
): PromiseResult<{ id: number }, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  type Row = Pick<PrincipalsTable, 'id'>;
  return queryOne<Row, typeof ErrorType.Conflict>(
    database,
    context,
    {
      text: 'INSERT INTO principals (provider, identifier, subjects_id) VALUES (?1, ?2, ?3) RETURNING id',
      values: [provider, identifier, subjectInternalId],
    },
    (error) => {
      if (
        database.adapter.isUniqueViolationOfConstraint(
          error,
          PrincipalsUniqueProviderIdentifierConstraint,
        )
      ) {
        return notOk.Conflict('Principal already exist');
      }
      return notOk.GenericUnexpectedException(context, error);
    },
  );
}
