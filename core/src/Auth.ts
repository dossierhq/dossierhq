import type { AuthContext, ErrorType, PromiseResult } from '.';
import * as Db from './Db';
import { Errors, ok } from './ErrorResult';

export interface Session {
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
): Promise<Session> {
  const { id } = await Db.queryOne(
    context.queryable,
    `SELECT s.id FROM subjects s, principals p WHERE p.provider = $1 AND p.identifier = $2 AND p.subjects_id = s.id`,
    [provider, identifier]
  );
  return { subjectId: id };
}

async function createPrincipal(
  context: AuthContext,
  provider: string,
  identifier: string
): PromiseResult<string, ErrorType.BadRequest | ErrorType.Conflict> {
  if (!provider || !identifier) {
    return Errors.BadRequest;
  }
  return await context.withTransaction(async (context) => {
    const { id, uuid } = await Db.queryOne<{ id: number; uuid: string }>(
      context.queryable,
      `INSERT INTO subjects DEFAULT VALUES RETURNING id, uuid`
    );
    try {
      await Db.queryNone(
        context.queryable,
        `INSERT INTO principals (provider, identifier, subjects_id) VALUES ($1, $2, $3)`,
        [provider, identifier, id]
      );
    } catch (error) {
      if (
        error.message ===
        'duplicate key value violates unique constraint "principals_provider_identifier_key"'
      ) {
        return Errors.Conflict;
      }
      throw error;
    }
    return ok(uuid);
  });
}
