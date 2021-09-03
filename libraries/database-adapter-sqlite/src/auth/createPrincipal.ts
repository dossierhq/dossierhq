import type { ErrorType, Result } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { Context, Session } from '@jonasb/datadata-server';
import { Temporal } from '@js-temporal/polyfill';
import { v4 as uuidv4 } from 'uuid';
import type { SqliteDatabaseAdapter } from '..';
import { PrincipalsUniqueProviderIdentifier, SubjectsTable } from '../DatabaseSchema';
import { isUniqueViolationOfConstraint } from '../ErrorUtils';
import { queryNone, queryOne } from '../QueryFunctions';
import { withSynchronousTransaction } from '../SqliteTransaction';

export function authCreatePrincipal(
  adapter: SqliteDatabaseAdapter,
  context: Context,
  provider: string,
  identifier: string
): Result<Session, ErrorType.Conflict | ErrorType.Generic> {
  return withSynchronousTransaction(adapter, () => {
    const uuid = uuidv4();
    const now = Temporal.Now.instant();
    const subjectsResult = queryOne<[SubjectsTable['id'], SubjectsTable['uuid']]>(
      adapter,
      'INSERT INTO subjects (uuid, created_at) VALUES ($1, $2) RETURNING id',
      [uuid, now.toString()]
    );
    if (subjectsResult.isError()) {
      return subjectsResult;
    }
    const [id] = subjectsResult.value;
    const principalsResult = queryNone(
      adapter,
      'INSERT INTO principals (provider, identifier, subjects_id) VALUES ($1, $2, $3)',
      [provider, identifier, id],
      (error) => {
        if (isUniqueViolationOfConstraint(error, PrincipalsUniqueProviderIdentifier)) {
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
