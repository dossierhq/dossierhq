import type { AdminEntity, AdminEntityCreate, AdminEntityUpdate } from '@datadata/core';
import { EntityAdmin } from '@datadata/server';
import type { SessionGraphQLContext } from '.';
import { buildResolversForAdminEntity } from './DataLoaders';
import { getSessionContext } from './Utils';

export async function createEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  entity: AdminEntityCreate
): Promise<AdminEntity> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.createEntity(sessionContext, entity);
  if (result.isError()) {
    throw result.toError();
  }
  return buildResolversForAdminEntity(sessionContext, result.value);
}

export async function updateEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  entity: AdminEntityUpdate
): Promise<AdminEntity> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.updateEntity(sessionContext, entity);
  if (result.isError()) {
    throw result.toError();
  }
  return buildResolversForAdminEntity(sessionContext, result.value);
}

export async function publishEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  entities: {
    id: string;
    version: number;
  }[]
): Promise<{ id: string }[]> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.publishEntities(sessionContext, entities);
  if (result.isError()) {
    throw result.toError();
  }
  return entities.map(({ id }) => ({ id }));
}

export async function unpublishEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  entityIds: string[]
): Promise<{ id: string }[]> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.unpublishEntities(sessionContext, entityIds);
  if (result.isError()) {
    throw result.toError();
  }
  return entityIds.map((id) => ({ id }));
}

export async function archiveEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string
): Promise<{ id: string }> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.archiveEntity(sessionContext, id);
  if (result.isError()) {
    throw result.toError();
  }
  return { id };
}

export async function unarchiveEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string
): Promise<{ id: string }> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.unarchiveEntity(sessionContext, id);
  if (result.isError()) {
    throw result.toError();
  }
  return { id };
}
