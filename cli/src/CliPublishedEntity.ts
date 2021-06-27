import type { Entity } from '@datadata/core';
import type { CliContext } from '..';
import { logEntity, logErrorResult, replaceEntityReferencesWithEntitiesGeneric } from './CliUtils';

export async function showEntity(context: CliContext, id: string): Promise<void> {
  const { publishedClient } = context;
  const result = await publishedClient.getEntity({ id });
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
      return await context.publishedClient.getEntity({ id });
    },
    async (context, ids) => {
      return await context.publishedClient.getEntities(ids.map((id) => ({ id })));
    }
  );
}
