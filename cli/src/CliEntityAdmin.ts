import chalk from 'chalk';
import inquirer from 'inquirer';
import type {
  EntityFieldSpecification,
  EntityTypeSpecification,
  SessionContext,
} from '@datadata/core';
import { EntityAdmin, EntityFieldType } from '@datadata/core';
import * as CliSchema from './CliSchema';
import { formatFieldValue, logEntity, logErrorResult, logKeyValue } from './CliUtils';
import { showConfirm } from './widgets/Confirm';
import type { ItemSelectorItem } from './widgets/ItemSelector';
import { showItemSelector } from './widgets/ItemSelector';
import { showStringEdit } from './widgets/StringEdit';

interface EditFieldSelectorItem extends ItemSelectorItem {
  defaultValue?: unknown;
}

export async function createEntity(context: SessionContext): Promise<{ id: string } | null> {
  const type = await CliSchema.selectEntityType(context);
  const entity = {
    _type: type,
    _name: '',
    ...(await editEntityValues(context, { _type: type })),
  };

  while (!entity._name) {
    entity._name = await showStringEdit('What name to use for the entity?');
  }

  const publish = await showConfirm('Publish the entity?');
  const result = await EntityAdmin.createEntity(context, entity, { publish });
  if (result.isError()) {
    logErrorResult('Failed creating entity', result);
    return null;
  }
  console.log(`${chalk.bold('Created:')} ${result.value.id}`);
  return result.value;
}

export async function editEntity(context: SessionContext, id: string): Promise<void> {
  const getResult = await EntityAdmin.getEntity(context, id, {});
  if (getResult.isError()) {
    logErrorResult('Failed fetching entity data', getResult);
    return;
  }

  const entity = { id, ...(await editEntityValues(context, getResult.value.item)) };
  const publish = await showConfirm('Publish the entity?');
  const updateResult = await EntityAdmin.updateEntity(context, entity, { publish });
  if (updateResult.isError()) {
    logErrorResult('Failed creating entity', updateResult);
    return;
  }
  console.log(`${chalk.bold('Updated:')} ${id}`);
}

async function editEntityValues(
  context: SessionContext,
  defaultValues: { _type: string; [fieldName: string]: unknown }
): Promise<Record<string, unknown>> {
  const { instance } = context;
  const schema = instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(defaultValues._type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${defaultValues._type}`);
  }

  const changedValues: Record<string, unknown> = {};

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const item = await showItemSelector(
      'Which field to edit?',
      createItemSelectorItems(entitySpec, changedValues, defaultValues)
    );
    if (item.id === '_exit') {
      break;
    }
    const fieldName = item.id;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fieldSpec = entitySpec.fields.find((x) => x.name === fieldName)!;
    changedValues[fieldName] = await editField(fieldSpec, item.defaultValue);
  }

  const nameFieldSpec = entitySpec.fields.find((x) => x.isName);
  if (nameFieldSpec) {
    const name = changedValues[nameFieldSpec.name];
    if (name) {
      changedValues._name = name;
    }
  }

  return changedValues;
}

function createItemSelectorItems(
  entitySpec: EntityTypeSpecification,
  currentValues: Record<string, unknown>,
  defaultValues: Record<string, unknown>
): EditFieldSelectorItem[] {
  const items: EditFieldSelectorItem[] = [];
  for (const fieldSpec of entitySpec.fields) {
    const value =
      fieldSpec.name in currentValues
        ? currentValues[fieldSpec.name]
        : defaultValues[fieldSpec.name];
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
  return await showStringEdit(fieldSpec.name, defaultValue as string);
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
    logKeyValue('  created at', version.createdAt.toISOString());
  }
}

export async function showLatestEntity(context: SessionContext, id: string): Promise<void> {
  const result = await EntityAdmin.getEntity(context, id, {});
  if (result.isOk()) {
    logEntity(context, result.value.item);
  } else {
    logErrorResult('Failed getting entity version', result);
  }
}

async function selectEntityVersion(
  context: SessionContext,
  message: string,
  id: string,
  defaultVersion: number | null
): Promise<number | null> {
  const result = await EntityAdmin.getEntityHistory(context, id);
  if (result.isError()) {
    logErrorResult('Failed retrieving history', result);
    return null;
  }

  const defaultItemId = typeof defaultVersion === 'number' ? String(defaultVersion) : undefined;
  const versionItems = result.value.versions
    .map((version) => {
      const tags = [];
      if (version.isDelete) tags.push(chalk.red('deleted'));
      if (version.isPublished) tags.push(chalk.green('published'));
      const tagsString = tags.join(', ');

      return {
        id: String(version.version),
        name: `${version.version} ${tagsString ? tagsString + ' ' : ''}${chalk.grey(
          `created at ${version.createdAt.toISOString()}`
        )}`,
      };
    })
    .reverse();

  const item = await showItemSelector(
    message,
    [...versionItems, { id: 'back', name: 'Done' }],
    defaultItemId
  );
  if (item.id === 'back') {
    return null;
  }
  return Number.parseInt(item.id);
}

export async function showEntityVersion(context: SessionContext, id: string): Promise<void> {
  let currentVersion: number | null = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    currentVersion = await selectEntityVersion(
      context,
      'Which entity version to view?',
      id,
      currentVersion
    );
    if (currentVersion === null) {
      return;
    }
    const result = await EntityAdmin.getEntity(context, id, { version: currentVersion });
    if (result.isOk()) {
      logEntity(context, result.value.item);
    } else {
      logErrorResult('Failed getting entity version', result);
    }
  }
}
