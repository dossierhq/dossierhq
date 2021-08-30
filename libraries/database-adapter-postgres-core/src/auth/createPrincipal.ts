import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { Context, Session } from '@jonasb/datadata-server';
import type { PostgresDatabaseAdapter } from '..';
import type { SubjectsTable } from '../DatabaseSchema';
import { UniqueConstraints } from '../DatabaseSchema';
import { queryNone, queryOne } from '../QueryFunctions';

export async function authCreatePrincipal(
  adapter: PostgresDatabaseAdapter,
  context: Context,
  provider: string,
  identifier: string
): PromiseResult<Session, ErrorType.Conflict | ErrorType.Generic> {
  return await context.withTransaction(async (context) => {
    const subjectsResult = await queryOne<Pick<SubjectsTable, 'id' | 'uuid'>>(
      context,
      adapter,
      'INSERT INTO subjects DEFAULT VALUES RETURNING id, uuid'
    );
    if (subjectsResult.isError()) {
      return subjectsResult;
    }
    const { id, uuid } = subjectsResult.value;
    try {
      await queryNone(
        context,
        adapter,
        'INSERT INTO principals (provider, identifier, subjects_id) VALUES ($1, $2, $3)',
        [provider, identifier, id]
      );
    } catch (error) {
      if (
        adapter.isUniqueViolationOfConstraint(
          error,
          UniqueConstraints.principals_provider_identifier_key
        )
      ) {
        return notOk.Conflict('Principal already exist');
      }
      throw error;
    }
    const session: Session = { subjectInternalId: id, subjectId: uuid };
    return ok(session);
  });
}
