import chalk from 'chalk';
import type { Context } from '@datadata/core';
import { showItemSelector } from './widgets/ItemSelector';

export function showSchema(context: Context<unknown>): void {
  const { instance } = context;
  const schema = instance.getSchema();
  for (const [typeName, typeSpec] of Object.entries(schema.spec.entityTypes)) {
    console.log(chalk.bold(typeName));
    for (const fieldSpec of typeSpec.fields) {
      console.log(
        `  ${chalk.bold(fieldSpec.name)}: ${fieldSpec.type}${
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
