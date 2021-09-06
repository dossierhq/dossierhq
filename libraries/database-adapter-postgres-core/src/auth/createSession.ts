import type { OkResult, PromiseResult } from '@jonasb/datadata-core';
import { ErrorType, notOk, ok } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-server';
import type { AuthCreateSessionPayload, Context, Session } from '@jonasb/datadata-server';
import type { PostgresDatabaseAdapter } from '..';
import type { SubjectsTable } from '../DatabaseSchema';
import { UniqueConstraints } from '../DatabaseSchema';
import { queryNone, queryNoneOrOne, queryOne } from '../QueryFunctions';

export async function authCreateSession(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  provider: string,
  identifier: string
): PromiseResult<AuthCreateSessionPayload, ErrorType.Generic> {
  const firstGetResult = await getSubject(adapter, context, provider, identifier);
  if (firstGetResult.isError()) {
    return firstGetResult;
  }
  if (firstGetResult.value) {
    return ok(firstGetResult.value);
  }

  const createResult = await createSubject(adapter, context, provider, identifier);
  if (createResult.isOk()) {
    return createResult.map((it) => it);
  }
  if (createResult.isErrorType(ErrorType.Conflict)) {
    // this should only happen if the principal is created by another request after our first check
    const secondGetResult = await getSubject(adapter, context, provider, identifier);
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

function createPayload<TError extends ErrorType>(
  principalEffect: 'created' | 'none',
  { id, uuid }: Pick<SubjectsTable, 'id' | 'uuid'>
): OkResult<AuthCreateSessionPayload, TError> {
  const session: Session = { subjectInternalId: id, subjectId: uuid };
  return ok({ principalEffect, session });
}

async function getSubject(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  provider: string,
  identifier: string
): PromiseResult<AuthCreateSessionPayload | null, ErrorType.Generic> {
  const result = await queryNoneOrOne<Pick<SubjectsTable, 'id' | 'uuid'>>(
    context,
    adapter,
    `SELECT s.id, s.uuid FROM subjects s, principals p
    WHERE p.provider = $1 AND p.identifier = $2 AND p.subjects_id = s.id`,
    [provider, identifier]
  );
  if (result.isError()) {
    return result;
  }
  if (result.value) {
    return createPayload('none', result.value);
  }
  return ok(null);
}

async function createSubject(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  provider: string,
  identifier: string
): PromiseResult<AuthCreateSessionPayload, ErrorType.Conflict | ErrorType.Generic> {
  return await context.withTransaction(async (context) => {
    const subjectsResult = await queryOne<Pick<SubjectsTable, 'id' | 'uuid'>>(
      context,
      adapter,
      'INSERT INTO subjects DEFAULT VALUES RETURNING id, uuid'
    );
    if (subjectsResult.isError()) {
      return subjectsResult;
    }
    const { id } = subjectsResult.value;
    const principalsResult = await queryNone(
      context,
      adapter,
      'INSERT INTO principals (provider, identifier, subjects_id) VALUES ($1, $2, $3)',
      [provider, identifier, id],
      (error) => {
        if (
          adapter.isUniqueViolationOfConstraint(
            error,
            UniqueConstraints.principals_provider_identifier_key
          )
        ) {
          return notOk.Conflict('Principal already exist');
        }
        return notOk.GenericUnexpectedException(error);
      }
    );
    if (principalsResult.isError()) {
      return principalsResult;
    }

    return createPayload('created', subjectsResult.value);
  });
}
