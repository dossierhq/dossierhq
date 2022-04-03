import type { OkResult, PromiseResult } from '@jonasb/datadata-core';
import { ErrorType, notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAuthCreateSessionPayload,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import { v4 as uuidv4 } from 'uuid';
import type { SubjectsTable } from '../DatabaseSchema';
import { PrincipalsUniqueProviderIdentifierConstraint } from '../DatabaseSchema';
import type { Database } from '../QueryFunctions';
import { queryNone, queryNoneOrOne, queryOne } from '../QueryFunctions';
import { createSession } from '../utils/SessionUtils';

export async function authCreateSession(
  database: Database,
  context: TransactionContext,
  provider: string,
  identifier: string
): PromiseResult<DatabaseAuthCreateSessionPayload, ErrorType.Generic> {
  const firstGetResult = await getSubject(database, context, provider, identifier);
  if (firstGetResult.isError()) {
    return firstGetResult;
  }
  if (firstGetResult.value) {
    return ok(firstGetResult.value);
  }

  const createResult = await createSubject(database, context, provider, identifier);
  if (createResult.isOk()) {
    return createResult.map((it) => it);
  }
  if (createResult.isErrorType(ErrorType.Conflict)) {
    // this should only happen if the principal is created by another request after our first check
    const secondGetResult = await getSubject(database, context, provider, identifier);
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
): OkResult<DatabaseAuthCreateSessionPayload, TError> {
  const session = createSession({ subjectInternalId: id, subjectId: uuid });
  return ok({ principalEffect, session });
}

async function getSubject(
  database: Database,
  context: TransactionContext,
  provider: string,
  identifier: string
): PromiseResult<DatabaseAuthCreateSessionPayload | null, ErrorType.Generic> {
  const result = await queryNoneOrOne<Pick<SubjectsTable, 'id' | 'uuid'>>(database, context, {
    text: `SELECT s.id, s.uuid FROM subjects s, principals p
    WHERE p.provider = ?1 AND p.identifier = ?2 AND p.subjects_id = s.id`,
    values: [provider, identifier],
  });
  if (result.isError()) {
    return result;
  }
  if (result.value) {
    return createPayload('none', result.value);
  }
  return ok(null);
}

async function createSubject(
  database: Database,
  context: TransactionContext,
  provider: string,
  identifier: string
): PromiseResult<DatabaseAuthCreateSessionPayload, ErrorType.Conflict | ErrorType.Generic> {
  return await context.withTransaction(async (context) => {
    const uuid = uuidv4();
    const now = Temporal.Now.instant();
    const subjectsResult = await queryOne<Pick<SubjectsTable, 'id'>>(database, context, {
      text: 'INSERT INTO subjects (uuid, created_at) VALUES (?1, ?2) RETURNING id',
      values: [uuid, now.toString()],
    });
    if (subjectsResult.isError()) {
      return subjectsResult;
    }
    const { id } = subjectsResult.value;
    const principalsResult = await queryNone(
      database,
      context,
      {
        text: 'INSERT INTO principals (provider, identifier, subjects_id) VALUES (?1, ?2, ?3)',
        values: [provider, identifier, id],
      },
      (error) => {
        if (
          database.adapter.isUniqueViolationOfConstraint(
            error,
            PrincipalsUniqueProviderIdentifierConstraint
          )
        ) {
          return notOk.Conflict('Principal already exist');
        }
        return notOk.GenericUnexpectedException(context, error);
      }
    );
    if (principalsResult.isError()) {
      return principalsResult;
    }

    return createPayload('created', { id, uuid });
  });
}
