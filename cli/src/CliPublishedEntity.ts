import type { Entity, SessionContext } from '@datadata/core';
import { PublishedEntity } from '@datadata/core';
import { logEntity, logErrorResult } from './CliUtils';

export async function showEntity(context: SessionContext, id: string): Promise<Entity | null> {
  const result = await PublishedEntity.getEntity(context, id);
  if (result.isError()) {
    logErrorResult('Failed getting entity', result);
    return null;
  }
  const entity = result.value.item;
  logEntity(context, entity);
  return entity;
}
