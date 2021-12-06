import type {
  AdminEntityCreate,
  AdminEntityCreatePayload,
  AdminEntityUpdate,
  AdminEntityUpdatePayload,
  AdminEntityUpsert,
  AdminEntityUpsertPayload,
  AdminSchema,
  EntityPublishPayload,
  EntityReferenceWithAuthKeys,
  EntityVersionReferenceWithAuthKeys,
} from '@jonasb/datadata-core';
import type { SessionGraphQLContext } from '.';
import { buildResolversForAdminEntity } from './DataLoaders';
import { getAdminClient } from './Utils';

export async function createEntity<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  entity: AdminEntityCreate
): Promise<AdminEntityCreatePayload> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.createEntity(entity);
  if (result.isError()) {
    throw result.toError();
  }
  return {
    effect: result.value.effect,
    entity: buildResolversForAdminEntity(schema, result.value.entity),
  };
}

export async function updateEntity<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  entity: AdminEntityUpdate
): Promise<AdminEntityUpdatePayload> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.updateEntity(entity);
  if (result.isError()) {
    throw result.toError();
  }
  return {
    effect: result.value.effect,
    entity: buildResolversForAdminEntity(schema, result.value.entity),
  };
}

export async function upsertEntity<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  entity: AdminEntityUpsert
): Promise<AdminEntityUpsertPayload> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.upsertEntity(entity);
  if (result.isError()) {
    throw result.toError();
  }
  return {
    effect: result.value.effect,
    entity: buildResolversForAdminEntity(schema, result.value.entity),
  };
}

export async function publishEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  references: EntityVersionReferenceWithAuthKeys[]
): Promise<EntityPublishPayload[]> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.publishEntities(references);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

export async function unpublishEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  references: EntityReferenceWithAuthKeys[]
): Promise<EntityPublishPayload[]> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.unpublishEntities(references);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

export async function archiveEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  reference: EntityReferenceWithAuthKeys
): Promise<EntityPublishPayload> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.archiveEntity(reference);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

export async function unarchiveEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  reference: EntityReferenceWithAuthKeys
): Promise<EntityPublishPayload> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.unarchiveEntity(reference);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}
