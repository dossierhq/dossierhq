import type { Entity } from '@datadata/core';
import type { SessionContext } from '@datadata/server';
import { PublishedEntity } from '@datadata/server';
import { logEntity, logErrorResult, replaceEntityReferencesWithEntitiesGeneric } from './CliUtils';

export async function showEntity(context: SessionContext, id: string): Promise<Entity | null> {
  const result = await PublishedEntity.getEntity(context, id);
  if (result.isError()) {
    logErrorResult('Failed getting entity', result);
    return null;
  }
  const entity = result.value;
  await replaceReferencesWithEntities(context, entity);
  logEntity(context, entity);
  return entity;
}

async function replaceReferencesWithEntities(context: SessionContext, entity: Entity) {
  await replaceEntityReferencesWithEntitiesGeneric(
    context,
    entity,
    async (context, id) => {
      return await PublishedEntity.getEntity(context, id);
    },
    async (context, ids) => {
      return await PublishedEntity.getEntities(context, ids);
    }
  );
}
