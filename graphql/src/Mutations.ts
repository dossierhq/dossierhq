import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  PublishingResult,
} from '@datadata/core';
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
): Promise<PublishingResult[]> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.publishEntities(sessionContext, entities);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

export async function unpublishEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  entityIds: string[]
): Promise<PublishingResult[]> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.unpublishEntities(sessionContext, entityIds);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

export async function archiveEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string
): Promise<PublishingResult> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.archiveEntity(sessionContext, id);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

export async function unarchiveEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string
): Promise<PublishingResult> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.unarchiveEntity(sessionContext, id);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}
