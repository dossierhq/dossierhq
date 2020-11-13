import chalk from 'chalk';
import type { Entity, SessionContext } from '@datadata/core';
import { PublishedEntity } from '@datadata/core';
import * as CliUtils from './CliUtils';

export async function showEntity(context: SessionContext, id: string): Promise<Entity | null> {
  const result = await PublishedEntity.getEntity(context, id);
  if (result.isError()) {
    CliUtils.logErrorResult('Failed getting entity', result);
    return null;
  }
  const entity = result.value.item;
  printEntity(context, entity);
  return entity;
}

function printEntity(context: SessionContext, entity: Entity) {
  printKeyValue('type', entity._type);
  printKeyValue('name', entity._name);
  printKeyValue('id', entity.id);

  const schema = context.instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(entity._type);
  if (!entitySpec) {
    console.log(chalk.red(`No entity spec exist for type ${entity._type}`));
    return;
  }

  for (const fieldSpec of entitySpec.fields) {
    const value = entity[fieldSpec.name];
    printKeyValue(fieldSpec.name, CliUtils.formatValue(fieldSpec, value));
  }
}

function printKeyValue(key: string, value: string) {
  console.log(`${chalk.bold(`${key}:`)} ${value}`);
}
