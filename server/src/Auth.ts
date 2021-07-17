import type { PromiseResult } from '@jonasb/datadata-core';
import { ErrorType, notOk, ok } from '@jonasb/datadata-core';
import type { AuthContext } from '.';
import { ensureRequired } from './Assertions';
import * as Db from './Database';
import type { SubjectsTable } from './DatabaseTables';

export interface Session {
  readonly subjectInternalId: number;
  /** UUID */
  readonly subjectId: string;
}

export default {
  createSessionForPrincipal,
  createPrincipal,
};

async function createSessionForPrincipal(
  context: AuthContext,
  provider: string,
  identifier: string,
  options?: {
    createPrincipalIfMissing?: boolean;
  }
): PromiseResult<Session, ErrorType.BadRequest | ErrorType.NotFound> {
  const assertion = ensureRequired({ provider, identifier });
  if (assertion.isError()) {
    return assertion;
  }
  try {
    const { id, uuid } = await Db.queryOne<Pick<SubjectsTable, 'id' | 'uuid'>>(
      context,
      'SELECT s.id, s.uuid FROM subjects s, principals p WHERE p.provider = $1 AND p.identifier = $2 AND p.subjects_id = s.id',
      [provider, identifier]
    );
    return ok({ subjectInternalId: id, subjectId: uuid });
  } catch (error) {
    if (error instanceof Db.UnexpectedQuantityError) {
      if (options?.createPrincipalIfMissing) {
        const creationResult = await doCreatePrincipal(context, provider, identifier);
        if (creationResult.isOk()) {
          return creationResult.map(({ id, uuid }) => ({
            subjectInternalId: id,
            subjectId: uuid,
          }));
        }
        if (creationResult.isErrorType(ErrorType.Conflict)) {
          // this should only happen if the principal is created by another request after our first check
          return await createSessionForPrincipal(context, provider, identifier);
        }
        // TODO Not sure how we could end up here. Ok to fall back to not found error?
      }
      return notOk.NotFound('Principal doesn’t exist');
    }
    throw error;
  }
}

/**
 *
 * @param context
 * @param provider
 * @param identifier
 * @returns The uuid of the created principal
 */
async function createPrincipal(
  context: AuthContext,
  provider: string,
  identifier: string
): PromiseResult<string, ErrorType.BadRequest | ErrorType.Conflict> {
  const result = await doCreatePrincipal(context, provider, identifier);
  return result.isOk() ? result.map(({ uuid }) => uuid) : result;
}

async function doCreatePrincipal(
  context: AuthContext,
  provider: string,
  identifier: string
): PromiseResult<{ id: number; uuid: string }, ErrorType.BadRequest | ErrorType.Conflict> {
  const assertion = ensureRequired({ provider, identifier });
  if (assertion.isError()) {
    return assertion;
  }
  return await context.withTransaction(async (context) => {
    const { id, uuid } = await Db.queryOne<Pick<SubjectsTable, 'id' | 'uuid'>>(
      context,
      'INSERT INTO subjects DEFAULT VALUES RETURNING id, uuid'
    );
    try {
      await Db.queryNone(
        context,
        'INSERT INTO principals (provider, identifier, subjects_id) VALUES ($1, $2, $3)',
        [provider, identifier, id]
      );
    } catch (error) {
      if (
        error.message ===
        'duplicate key value violates unique constraint "principals_provider_identifier_key"'
      ) {
        return notOk.Conflict('Principal already exist');
      }
      throw error;
    }
    return ok({ id, uuid });
  });
}
