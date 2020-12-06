import chalk from 'chalk';
import { FieldType } from '@datadata/core';
import type { Context } from '@datadata/core';
import { showItemSelector, showMultiItemSelector } from './widgets';

export function showSchema(context: Context<unknown>): void {
  const { instance } = context;
  const schema = instance.getSchema();
  for (const [typeName, typeSpec] of Object.entries(schema.spec.entityTypes)) {
    console.log(chalk.bold(typeName));
    for (const fieldSpec of typeSpec.fields) {
      let type: string = fieldSpec.type;
      if (type === FieldType.EntityType && (fieldSpec.entityTypes?.length ?? 0) > 0) {
        type = `${type} (${fieldSpec.entityTypes?.join(', ')})`;
      }
      if (fieldSpec.list) {
        type = `[${type}]`;
      }
      console.log(
        `  ${chalk.bold(fieldSpec.name)}: ${type}${
          fieldSpec.isName === true ? chalk.grey('  entity name') : ''
        }`
      );
    }
  }
}

export async function selectEntityType(context: Context<unknown>): Promise<string> {
  const { instance } = context;
  const schema = instance.getSchema();
  const types = Object.keys(schema.spec.entityTypes);
  const { name: typeName } = await showItemSelector(
    'Which entity type?',
    types.map((x) => ({ id: x, name: x }))
  );
  return typeName;
}

export async function selectEntityTypes(context: Context<unknown>): Promise<string[]> {
  const { instance } = context;
  const schema = instance.getSchema();
  const types = Object.keys(schema.spec.entityTypes);
  const items = await showMultiItemSelector(
    'Which entity types?',
    types.map((x) => ({ id: x, name: x }))
  );
  return items.map((x) => x.id);
}
