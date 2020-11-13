import chalk from 'chalk';
import type { Entity, SessionContext } from '@datadata/core';
import { PublishedEntity } from '@datadata/core';
import { formatFieldValue, logErrorResult, logKeyValue } from './CliUtils';

export async function showEntity(context: SessionContext, id: string): Promise<Entity | null> {
  const result = await PublishedEntity.getEntity(context, id);
  if (result.isError()) {
    logErrorResult('Failed getting entity', result);
    return null;
  }
  const entity = result.value.item;
  printEntity(context, entity);
  return entity;
}

function printEntity(context: SessionContext, entity: Entity) {
  logKeyValue('type', entity._type);
  logKeyValue('name', entity._name);
  logKeyValue('id', entity.id);

  const schema = context.instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(entity._type);
  if (!entitySpec) {
    console.log(chalk.red(`No entity spec exist for type ${entity._type}`));
    return;
  }

  for (const fieldSpec of entitySpec.fields) {
    const value = entity[fieldSpec.name];
    logKeyValue(fieldSpec.name, formatFieldValue(fieldSpec, value));
  }
}
