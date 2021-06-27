import type { Entity } from '@datadata/core';
import type { CliContext } from '..';
import { PublishedEntity } from '@datadata/server';
import { logEntity, logErrorResult, replaceEntityReferencesWithEntitiesGeneric } from './CliUtils';

export async function showEntity(context: CliContext, id: string): Promise<void> {
  const result = await PublishedEntity.getEntity(context.context, id);
  if (result.isError()) {
    logErrorResult('Failed getting entity', result);
    return;
  }
  const entity = result.value;
  await replaceReferencesWithEntities(context, entity);
  logEntity(context, entity);
}

async function replaceReferencesWithEntities(context: CliContext, entity: Entity) {
  await replaceEntityReferencesWithEntitiesGeneric(
    context,
    entity,
    async (context, id) => {
      return await PublishedEntity.getEntity(context.context, id);
    },
    async (context, ids) => {
      return await PublishedEntity.getEntities(context.context, ids);
    }
  );
}
