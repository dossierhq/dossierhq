import chalk from 'chalk';
import inquirer from 'inquirer';
import { EntityAdmin, SessionContext } from '@datadata/core';
import { EntityFieldSpecification, EntityFieldType, EntityTypeSpecification } from '@datadata/core';
import * as CliSchema from './CliSchema';
import { formatFieldValue, logErrorResult, logKeyValue } from './CliUtils';
import { showConfirm } from './widgets/Confirm';
import type { ItemSelectorItem } from './widgets/ItemSelector';
import { showItemSelector } from './widgets/ItemSelector';

//TODO move to core?
interface AdminEntityCreate {
  /** UUIDv4 */
  id?: string;
  _name: string;
  _type: string;
  [fieldName: string]: unknown;
}
//TODO move to core?
interface EditEntity {
  _type: string;
  [fieldName: string]: unknown;
}

interface EditFieldSelectorItem extends ItemSelectorItem {
  defaultValue?: unknown;
}

export async function createEntity(context: SessionContext): Promise<{ id: string } | null> {
  const type = await CliSchema.selectEntityType(context);
  const entity = (await editEntity(context, { _type: type })) as AdminEntityCreate;
  const publish = await showConfirm('Publish the entity?');
  const result = await EntityAdmin.createEntity(context, entity, { publish });
  if (result.isError()) {
    logErrorResult('Failed creating entity', result);
    return null;
  }
  console.log(`${chalk.bold('Created:')} ${result.value.id}`);
  return result.value;
}

async function editEntity(
  context: SessionContext,
  startingEntity: EditEntity
): Promise<Record<string, unknown>> {
  const { instance } = context;
  const schema = instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(startingEntity._type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${startingEntity._type}`);
  }

  const changedEntity: Record<string, unknown> = { _type: startingEntity._type };

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const item = await showItemSelector(
      'Which field to edit?',
      createItemSelectorItems(entitySpec, changedEntity)
    );
    if (item.id === '_exit') {
      break;
    }
    const fieldName = item.id;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fieldSpec = entitySpec.fields.find((x) => x.name === fieldName)!;
    changedEntity[fieldName] = await editField(fieldSpec, item.defaultValue);
  }

  const nameFieldSpec = entitySpec.fields.find((x) => x.isName);
  if (nameFieldSpec) {
    const name = changedEntity[nameFieldSpec.name];
    if (name) {
      changedEntity._name = name;
    }
  }

  return changedEntity;
}

function createItemSelectorItems(
  entitySpec: EntityTypeSpecification,
  entity: Record<string, unknown>
): EditFieldSelectorItem[] {
  const items: EditFieldSelectorItem[] = [];
  for (const fieldSpec of entitySpec.fields) {
    const value = entity[fieldSpec.name];
    items.push({
      id: fieldSpec.name,
      name: `${chalk.bold(fieldSpec.name)}: ${formatFieldValue(fieldSpec, value)}`,
      defaultValue: value,
    });
  }
  items.push({ id: '_exit', name: 'Done' });
  return items;
}

async function editField(fieldSpec: EntityFieldSpecification, defaultValue: unknown) {
  switch (fieldSpec.type) {
    case EntityFieldType.String:
      return editFieldString(fieldSpec, defaultValue);
  }
  throw new Error(`Unknown type (${fieldSpec.type})`);
}

async function editFieldString(fieldSpec: EntityFieldSpecification, defaultValue: unknown) {
  const { value } = await inquirer.prompt([
    {
      name: 'value',
      type: 'input',
      message: fieldSpec.name,
      default: defaultValue,
    },
  ]);
  return value;
}

export async function deleteEntity(context: SessionContext, id: string): Promise<void> {
  const publish = await showConfirm('Publish the deletion of the entity?');
  const result = await EntityAdmin.deleteEntity(context, id, { publish });
  if (result.isError()) {
    logErrorResult('Failed creating entity', result);
    return;
  }
  console.log(`${chalk.bold('Deleted:')} ${id}`);
}

export async function showEntityHistory(context: SessionContext, id: string): Promise<void> {
  const result = await EntityAdmin.getEntityHistory(context, id);
  if (result.isError()) {
    logErrorResult('Failed retrieving history', result);
    return;
  }
  const history = result.value;
  logKeyValue('type', history.type);
  logKeyValue('name', history.name);
  logKeyValue('id', history.id);
  for (const version of history.versions) {
    const tags = [];
    if (version.isDelete) tags.push(chalk.red('deleted'));
    if (version.isPublished) tags.push(chalk.green('published'));
    logKeyValue('version', `${version.version} ${tags.join(', ')}`);
    logKeyValue('  created by', version.createdBy);
    logKeyValue('  created ay', version.createdAt.toISOString());
  }
}
