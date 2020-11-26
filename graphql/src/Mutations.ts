import { EntityAdmin } from '@datadata/core';
import type { AdminEntity, AdminEntityCreate } from '@datadata/core';
import type { SessionGraphQLContext } from '.';
import { getSessionContext } from './Utils';

export async function createEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  entity: AdminEntityCreate,
  publish: boolean
): Promise<AdminEntity> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.createEntity(sessionContext, entity, { publish });
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

export async function deleteEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string,
  publish: boolean
): Promise<AdminEntity> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.deleteEntity(sessionContext, id, { publish });
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}
