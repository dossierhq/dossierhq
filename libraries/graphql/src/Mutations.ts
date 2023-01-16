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
  AdvisoryLockOptions,
  AdvisoryLockPayload,
  AdvisoryLockReleasePayload,
  EntityReference,
  EntityVersionReference,
} from '@dossierhq/core';
import { buildResolversForAdminEntity } from './DataLoaders.js';
import type { SessionGraphQLContext } from './GraphQLSchemaGenerator.js';

export async function createEntity<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  entity: AdminEntityCreate,
  options: AdminEntityMutationOptions
): Promise<AdminEntityCreatePayload> {
  const adminClient = context.adminClient.valueOrThrow();
  const result = await adminClient.createEntity(entity, options);
  const payload = result.valueOrThrow();
  return {
    effect: payload.effect,
    entity: buildResolversForAdminEntity(schema, payload.entity),
  };
}

export async function updateEntity<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  entity: AdminEntityUpdate,
  options: AdminEntityMutationOptions
): Promise<AdminEntityUpdatePayload> {
  const adminClient = context.adminClient.valueOrThrow();
  const result = await adminClient.updateEntity(entity, options);
  const payload = result.valueOrThrow();
  return {
    effect: payload.effect,
    entity: buildResolversForAdminEntity(schema, payload.entity),
  };
}

export async function upsertEntity<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  entity: AdminEntityUpsert,
  options: AdminEntityMutationOptions
): Promise<AdminEntityUpsertPayload> {
  const adminClient = context.adminClient.valueOrThrow();
  const result = await adminClient.upsertEntity(entity, options);
  const payload = result.valueOrThrow();
  return {
    effect: payload.effect,
    entity: buildResolversForAdminEntity(schema, payload.entity),
  };
}

export async function publishEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  references: EntityVersionReference[]
): Promise<AdminEntityPublishPayload[]> {
  const adminClient = context.adminClient.valueOrThrow();
  const result = await adminClient.publishEntities(references);
  return result.valueOrThrow();
}

export async function unpublishEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  references: EntityReference[]
): Promise<AdminEntityUnpublishPayload[]> {
  const adminClient = context.adminClient.valueOrThrow();
  const result = await adminClient.unpublishEntities(references);
  return result.valueOrThrow();
}

export async function archiveEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  reference: EntityReference
): Promise<AdminEntityArchivePayload> {
  const adminClient = context.adminClient.valueOrThrow();
  const result = await adminClient.archiveEntity(reference);
  return result.valueOrThrow();
}

export async function unarchiveEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  reference: EntityReference
): Promise<AdminEntityUnarchivePayload> {
  const adminClient = context.adminClient.valueOrThrow();
  const result = await adminClient.unarchiveEntity(reference);
  return result.valueOrThrow();
}

export async function acquireAdvisoryLock<TContext extends SessionGraphQLContext>(
  context: TContext,
  name: string,
  options: AdvisoryLockOptions
): Promise<AdvisoryLockPayload> {
  const adminClient = context.adminClient.valueOrThrow();
  const result = await adminClient.acquireAdvisoryLock(name, options);
  return result.valueOrThrow();
}

export async function renewAdvisoryLock<TContext extends SessionGraphQLContext>(
  context: TContext,
  name: string,
  handle: number
): Promise<AdvisoryLockPayload> {
  const adminClient = context.adminClient.valueOrThrow();
  const result = await adminClient.renewAdvisoryLock(name, handle);
  return result.valueOrThrow();
}

export async function releaseAdvisoryLock<TContext extends SessionGraphQLContext>(
  context: TContext,
  name: string,
  handle: number
): Promise<AdvisoryLockReleasePayload> {
  const adminClient = context.adminClient.valueOrThrow();
  const result = await adminClient.releaseAdvisoryLock(name, handle);
  return result.valueOrThrow();
}
