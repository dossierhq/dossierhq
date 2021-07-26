import type { AdminEntity, Entity, ErrorType, PromiseResult, Result } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { InMemorySessionContext } from '.';

export async function getEntity(
  context: InMemorySessionContext,
  id: string
): PromiseResult<Entity, ErrorType.NotFound> {
  const entity = context.server.getEntity(id, null); //TODO should select published version
  if (entity) {
    return ok(convertAdminEntity(entity));
  }
  return notOk.NotFound('No such entity or version');
}

export async function getEntities(
  context: InMemorySessionContext,
  ids: string[]
): PromiseResult<Result<Entity, ErrorType.NotFound>[], ErrorType.Generic> {
  return ok(await Promise.all(ids.map((id) => getEntity(context, id))));
}

function convertAdminEntity(entity: AdminEntity): Entity {
  const {
    id,
    info: { type, name },
    fields,
  } = entity;
  return { id, info: { type, name }, fields };
}
