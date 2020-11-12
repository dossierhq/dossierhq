import type { AuthContext, ErrorType, PromiseResult } from '.';
import { ensureRequired } from './Assertions';
import * as Db from './Db';
import { notOk, ok } from './ErrorResult';

export interface Session {
  readonly subjectId: number;
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
    const { id } = await Db.queryOne<{ id: number }>(
      context,
      'SELECT s.id FROM subjects s, principals p WHERE p.provider = $1 AND p.identifier = $2 AND p.subjects_id = s.id',
      [provider, identifier]
    );
    return ok({ subjectId: id });
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
    const { id, uuid } = await Db.queryOne<{ id: number; uuid: string }>(
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
