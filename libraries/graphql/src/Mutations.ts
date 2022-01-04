import type {
  AdminEntityArchivePayload,
  AdminEntityCreate,
  AdminEntityCreatePayload,
  AdminEntityMutationOptions,
  AdminEntityPublishPayload,
  AdminEntityUnarchivePayload,
  AdminEntityUnpublishPayload,
  AdminEntityUpdate,
  AdminEntityUpdatePayload,
  AdminEntityUpsert,
  AdminEntityUpsertPayload,
  AdminSchema,
  EntityReference,
  EntityVersionReference,
} from '@jonasb/datadata-core';
import type { SessionGraphQLContext } from '.';
import { buildResolversForAdminEntity } from './DataLoaders';
import { getAdminClient } from './Utils';

export async function createEntity<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  entity: AdminEntityCreate,
  options: AdminEntityMutationOptions
): Promise<AdminEntityCreatePayload> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.createEntity(entity, options);
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
  entity: AdminEntityUpdate,
  options: AdminEntityMutationOptions
): Promise<AdminEntityUpdatePayload> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.updateEntity(entity, options);
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
  entity: AdminEntityUpsert,
  options: AdminEntityMutationOptions
): Promise<AdminEntityUpsertPayload> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.upsertEntity(entity, options);
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
  references: EntityVersionReference[]
): Promise<AdminEntityPublishPayload[]> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.publishEntities(references);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

export async function unpublishEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  references: EntityReference[]
): Promise<AdminEntityUnpublishPayload[]> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.unpublishEntities(references);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

export async function archiveEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  reference: EntityReference
): Promise<AdminEntityArchivePayload> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.archiveEntity(reference);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

export async function unarchiveEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  reference: EntityReference
): Promise<AdminEntityUnarchivePayload> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.unarchiveEntity(reference);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}
