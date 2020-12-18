import chalk from 'chalk';
import { FieldType } from '@datadata/core';
import type { Context } from '@datadata/core';
import { showItemSelector, showMultiItemSelector } from './widgets';
import { logKeyValue } from './CliUtils';

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

export async function selectValueType(
  context: Context<unknown>,
  filterTypes?: string[]
): Promise<string> {
  const { instance } = context;
  const schema = instance.getSchema();

  filterTypes?.forEach((x) => {
    if (!schema.spec.valueTypes[x]) throw new Error(`Specified filter type ${x} doesn't exist`);
  });

  const types =
    filterTypes && filterTypes.length > 0 ? filterTypes : Object.keys(schema.spec.valueTypes);

  if (types.length === 1) {
    logKeyValue('Value type', types[0]);
    return types[0];
  }

  const { name: typeName } = await showItemSelector(
    'Which value type?',
    types.map((x) => ({ id: x, name: x }))
  );
  return typeName;
}
