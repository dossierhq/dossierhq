import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { Context, Session } from '@jonasb/datadata-server';
import { Temporal } from '@js-temporal/polyfill';
import { v4 as uuidv4 } from 'uuid';
import type { SqliteDatabaseAdapter } from '..';
import type { SubjectsTable } from '../DatabaseSchema';
import { PrincipalsUniqueProviderIdentifier } from '../DatabaseSchema';
import { queryNone, queryOne } from '../QueryFunctions';

export async function authCreatePrincipal(
  adapter: SqliteDatabaseAdapter,
  context: Context,
  provider: string,
  identifier: string
): PromiseResult<Session, ErrorType.Conflict | ErrorType.Generic> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return await context.withTransaction(async (context) => {
    const uuid = uuidv4();
    const now = Temporal.Now.instant();
    const subjectsResult = await queryOne<Pick<SubjectsTable, 'id'>>(
      adapter,
      'INSERT INTO subjects (uuid, created_at) VALUES ($1, $2) RETURNING id',
      [uuid, now.toString()]
    );
    if (subjectsResult.isError()) {
      return subjectsResult;
    }
    const { id } = subjectsResult.value;
    const principalsResult = await queryNone(
      adapter,
      'INSERT INTO principals (provider, identifier, subjects_id) VALUES ($1, $2, $3)',
      [provider, identifier, id],
      (error) => {
        if (adapter.isUniqueViolationOfConstraint(error, PrincipalsUniqueProviderIdentifier)) {
          return notOk.Conflict('Principal already exist');
        }
        return notOk.GenericUnexpectedException(error);
      }
    );
    if (principalsResult.isError()) {
      return principalsResult;
    }

    const session: Session = { subjectInternalId: id, subjectId: uuid };
    return ok(session);
  });
}
