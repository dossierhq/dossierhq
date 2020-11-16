import type { AuthContext, ErrorType, PromiseResult } from '.';
import { ensureRequired } from './Assertions';
import * as Db from './Db';
import type { SubjectsTable } from './DbTableTypes';
import { notOk, ok } from './ErrorResult';

export interface Session {
  readonly subjectInternalId: number;
  /** UUIDv4 */
  readonly subjectId: string;
}

export default {
  createSessionForPrincipal,
  createPrincipal,
};

async function createSessionForPrincipal(
  context: AuthContext,
  provider: string,
  identifier: string
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
      return notOk.NotFound('Principal doesn’t exist');
    }
    throw error;
  }
}

async function createPrincipal(
  context: AuthContext,
  provider: string,
  identifier: string
): PromiseResult<string, ErrorType.BadRequest | ErrorType.Conflict> {
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
    return ok(uuid);
  });
}
