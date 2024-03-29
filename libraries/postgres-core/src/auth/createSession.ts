import { ErrorType, notOk, ok, type OkResult, type PromiseResult } from '@dossierhq/core';
import {
  buildPostgresSqlQuery,
  type DatabaseAuthCreateSessionPayload,
  type TransactionContext,
  type WriteSession,
} from '@dossierhq/database-adapter';
import { UniqueConstraints, type SubjectsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone, queryNoneOrOne, queryOne } from '../QueryFunctions.js';
import { createSession } from '../utils/SessionUtils.js';

export async function authCreateSession(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  provider: string,
  identifier: string,
  readonly: boolean,
): PromiseResult<DatabaseAuthCreateSessionPayload, typeof ErrorType.Generic> {
  const firstGetResult = await getSubject(adapter, context, provider, identifier, readonly);
  if (firstGetResult.isError()) return firstGetResult;

  if (firstGetResult.value) {
    return ok(firstGetResult.value);
  }

  if (readonly) {
    return ok({ principalEffect: 'none', session: { type: 'readonly', subjectId: null } });
  }

  const createResult = await createSubject(adapter, context, provider, identifier);
  if (createResult.isOk()) {
    return createResult.map((it) => it);
  }
  if (createResult.isErrorType(ErrorType.Conflict)) {
    // this should only happen if the principal is created by another request after our first check
    const secondGetResult = await getSubject(adapter, context, provider, identifier, readonly);
    if (secondGetResult.isError()) {
      return secondGetResult;
    }
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
  database: PostgresDatabaseAdapter,
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
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  { subjectId }: { subjectId: string },
) {
  const getResult = await queryNoneOrOne<Pick<SubjectsTable, 'id'>>(
    adapter,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      sql`SELECT id FROM subjects WHERE uuid = ${subjectId}`;
    }),
  );
  if (getResult.isError()) return getResult;
  let subjectInternalId = getResult.value?.id ?? null;

  if (subjectInternalId === null) {
    const insertResult = await queryOne<Pick<SubjectsTable, 'id'>>(
      adapter,
      context,
      buildPostgresSqlQuery(({ sql }) => {
        sql`INSERT INTO subjects (uuid) VALUES (${subjectId}) RETURNING id`;
      }),
    );
    if (insertResult.isError()) return insertResult;
    subjectInternalId = insertResult.value.id;
  }

  return ok({ id: subjectInternalId });
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
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  provider: string,
  identifier: string,
  readonly: boolean,
): PromiseResult<DatabaseAuthCreateSessionPayload | null, typeof ErrorType.Generic> {
  const result = await queryNoneOrOne<Pick<SubjectsTable, 'id' | 'uuid'>>(adapter, context, {
    text: `SELECT s.id, s.uuid FROM subjects s, principals p
    WHERE p.provider = $1 AND p.identifier = $2 AND p.subjects_id = s.id`,
    values: [provider, identifier],
  });
  if (result.isError()) return result;

  if (result.value) {
    return createPayload('none', readonly, result.value);
  }
  return ok(null);
}

async function createSubject(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  provider: string,
  identifier: string,
): PromiseResult<
  DatabaseAuthCreateSessionPayload,
  typeof ErrorType.Conflict | typeof ErrorType.Generic
> {
  return await context.withTransaction(async (context) => {
    const subjectsResult = await queryOne<Pick<SubjectsTable, 'id' | 'uuid'>>(
      adapter,
      context,
      'INSERT INTO subjects DEFAULT VALUES RETURNING id, uuid',
    );
    if (subjectsResult.isError()) return subjectsResult;
    const { id } = subjectsResult.value;

    const createResult = await createPrincipal(adapter, context, provider, identifier, id);
    if (createResult.isError()) return createResult;

    return createPayload('created', false, subjectsResult.value);
  });
}

export function createPrincipal(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  provider: string,
  identifier: string,
  subjectInternalId: number,
) {
  return queryNone(
    adapter,
    context,
    {
      text: 'INSERT INTO principals (provider, identifier, subjects_id) VALUES ($1, $2, $3)',
      values: [provider, identifier, subjectInternalId],
    },
    (error) => {
      if (
        adapter.isUniqueViolationOfConstraint(
          error,
          UniqueConstraints.principals_provider_identifier_key,
        )
      ) {
        return notOk.Conflict('Principal already exist');
      }
      return notOk.GenericUnexpectedException(context, error);
    },
  );
}
