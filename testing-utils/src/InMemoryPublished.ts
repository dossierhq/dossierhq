import type { AdminEntity, ErrorType, PromiseResult, Result } from '@datadata/core';
import { notOk, ok } from '@datadata/core';
import type { InMemorySessionContext } from '.';

export async function getEntity(
  context: InMemorySessionContext,
  id: string
): PromiseResult<AdminEntity, ErrorType.NotFound> {
  const entity = context.server.getEntity(id, null); //TODO should select published version
  if (entity) {
    return ok(entity);
  }
  return notOk.NotFound('No such entity or version');
}

export async function getEntities(
  context: InMemorySessionContext,
  ids: string[]
): Promise<Result<AdminEntity, ErrorType.NotFound>[]> {
  return await Promise.all(ids.map((id) => getEntity(context, id)));
}
