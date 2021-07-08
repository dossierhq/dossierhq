import type {
  AdminEntity2,
  AdminEntityCreate2,
  AdminEntityUpdate2,
  EntityVersionReference,
  PublishingResult,
} from '@datadata/core';
import type { SessionGraphQLContext } from '.';
import { buildResolversForAdminEntity } from './DataLoaders';
import { getAdminClient, getSchema } from './Utils';

export async function createEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  entity: AdminEntityCreate2
): Promise<AdminEntity2> {
  const schema = getSchema(context);
  const adminClient = getAdminClient(context);
  const result = await adminClient.createEntity(entity);
  if (result.isError()) {
    throw result.toError();
  }
  return buildResolversForAdminEntity(schema, result.value);
}

export async function updateEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  entity: AdminEntityUpdate2
): Promise<AdminEntity2> {
  const schema = getSchema(context);
  const adminClient = getAdminClient(context);
  const result = await adminClient.updateEntity(entity);
  if (result.isError()) {
    throw result.toError();
  }
  return buildResolversForAdminEntity(schema, result.value);
}

export async function publishEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  entities: EntityVersionReference[]
): Promise<PublishingResult[]> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.publishEntities(entities);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

export async function unpublishEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  entityIds: string[]
): Promise<PublishingResult[]> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.unpublishEntities(entityIds.map((id) => ({ id })));
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

export async function archiveEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string
): Promise<PublishingResult> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.archiveEntity({ id });
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

export async function unarchiveEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string
): Promise<PublishingResult> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.unarchiveEntity({ id });
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}
