import type { Entity, SessionContext } from '@datadata/core';
import { PublishedEntity } from '@datadata/core';
import { logEntity, logErrorResult, replaceReferencesWithEntitiesGeneric } from './CliUtils';

export async function showEntity(context: SessionContext, id: string): Promise<Entity | null> {
  const result = await PublishedEntity.getEntity(context, id);
  if (result.isError()) {
    logErrorResult('Failed getting entity', result);
    return null;
  }
  const entity = result.value.item;
  await replaceReferencesWithEntities(context, entity);
  logEntity(context, entity);
  return entity;
}

async function replaceReferencesWithEntities(context: SessionContext, entity: Entity) {
  await replaceReferencesWithEntitiesGeneric(context, entity, async (context, id) => {
    return await PublishedEntity.getEntity(context, id);
  });
}
