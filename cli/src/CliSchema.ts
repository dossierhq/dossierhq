import chalk from 'chalk';
import type { Context } from '@datadata/core';

export function showSchema(context: Context<unknown>): void {
  const { instance } = context;
  const schema = instance.getSchema();
  for (const [typeName, typeSpec] of Object.entries(schema.spec.types)) {
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
