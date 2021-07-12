import chalk from 'chalk';
import { FieldType } from '@jonasb/datadata-core';
import type { EntityTypeSpecification, ValueTypeSpecification } from '@jonasb/datadata-core';
import { showItemSelector, showMultiItemSelector } from './widgets';
import { logKeyValue } from './CliUtils';
import type { CliContext } from '..';

export function showSchema(context: CliContext): void {
  const { schema } = context;

  const logTypeSpec = (typeSpec: EntityTypeSpecification | ValueTypeSpecification) => {
    console.log(chalk.bold(typeSpec.name));
    for (const fieldSpec of typeSpec.fields) {
      let type: string = fieldSpec.type;
      if (type === FieldType.EntityType && (fieldSpec.entityTypes?.length ?? 0) > 0) {
        type = `${type} (${fieldSpec.entityTypes?.join(', ')})`;
      } else if (type === FieldType.ValueType && (fieldSpec.valueTypes?.length ?? 0) > 0) {
        type = `${type} (${fieldSpec.valueTypes?.join(', ')})`;
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
  };

  if (schema.getEntityTypeCount() > 0) {
    console.log(chalk.cyan(chalk.bold('Entity types')));
    for (const entitySpec of schema.spec.entityTypes) {
      logTypeSpec(entitySpec);
    }
  }
  if (schema.getValueTypeCount() > 0) {
    console.log(chalk.cyan(chalk.bold('Value types')));
    for (const valueSpec of schema.spec.valueTypes) {
      logTypeSpec(valueSpec);
    }
  }
}

export async function selectEntityType(context: CliContext): Promise<string> {
  const { schema } = context;
  const types = schema.spec.entityTypes.map((x) => x.name);
  const { name: typeName } = await showItemSelector(
    'Which entity type?',
    types.map((x) => ({ id: x, name: x }))
  );
  return typeName;
}

export async function selectEntityTypes(context: CliContext): Promise<string[]> {
  const { schema } = context;
  const types = schema.spec.entityTypes.map((x) => x.name);
  const items = await showMultiItemSelector(
    'Which entity types?',
    types.map((x) => ({ id: x, name: x }))
  );
  return items.map((x) => x.id);
}

export async function selectValueType(
  context: CliContext,
  filterTypes?: string[]
): Promise<string> {
  const { schema } = context;

  filterTypes?.forEach((x) => {
    if (!schema.getValueTypeSpecification(x)) {
      throw new Error(`Specified filter type ${x} doesn't exist`);
    }
  });

  const types =
    filterTypes && filterTypes.length > 0 ? filterTypes : schema.spec.valueTypes.map((x) => x.name);

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
