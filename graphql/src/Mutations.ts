import { EntityAdmin } from '@datadata/core';
import type { AdminEntity } from '@datadata/core';
import type { SessionGraphQLContext } from '.';
import { getSessionContext } from './Utils';

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
