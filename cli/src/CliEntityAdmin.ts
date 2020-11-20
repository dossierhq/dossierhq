import chalk from 'chalk';
import {
  isReferenceFieldType,
  isStringFieldType,
  ok,
  notOk,
  EntityAdmin,
  EntityFieldType,
  ErrorType,
} from '@datadata/core';
import type {
  AdminEntity,
  EntityFieldSpecification,
  EntityTypeSpecification,
  PromiseResult,
  SessionContext,
} from '@datadata/core';
import * as CliSchema from './CliSchema';
import {
  formatEntityOneLine,
  formatFieldValue,
  isReferenceAnEntity,
  logEntity,
  logErrorResult,
  logKeyValue,
} from './CliUtils';
import { showConfirm } from './widgets/Confirm';
import type { ItemSelectorItem } from './widgets/ItemSelector';
import { showItemSelector } from './widgets/ItemSelector';
import { showStringEdit } from './widgets/StringEdit';

interface EditFieldSelectorItem extends ItemSelectorItem {
  defaultValue?: unknown;
}

export async function searchEntities(context: SessionContext): Promise<void> {
  const result = await EntityAdmin.searchEntities(context);
  if (result.isError()) {
    logErrorResult('Failed fetching entity data', result);
    return;
  }
  console.log(chalk.cyan('Entity type | Name | Id'));
  for (const entity of result.value.items) {
    console.log(formatEntityOneLine(entity));
  }
}

async function selectEntity(
  context: SessionContext,
  message: string,
  unusedDefaultValue: { id: string } | null
): PromiseResult<AdminEntity, ErrorType.NotFound> {
  const result = await EntityAdmin.searchEntities(context);
  if (result.isError()) {
    return result;
  }
  if (result.value.items.length === 0) {
    return notOk.NotFound('No entries found');
  }
  const item = await showItemSelector<{ id: string; name: string; entity: AdminEntity }>(
    message,
    result.value.items.map((entity) => ({
      id: entity.id,
      name: formatEntityOneLine(entity),
      entity,
    }))
  );
  return ok(item.entity);
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
    logErrorResult('Failed updating entity', updateResult);
    return;
  }
  console.log(`${chalk.bold('Updated:')} ${id}`);
}

async function editEntityValues(
  context: SessionContext,
  defaultValues: { _type: string; [fieldName: string]: unknown }
): Promise<Record<string, unknown>> {
  const entitySpec = getEntitySpec(context, defaultValues);
  const changedValues: Record<string, unknown> = {};

  await replaceReferencesWithEntities(context, defaultValues);

  let lastItemId = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const item: EditFieldSelectorItem = await showItemSelector(
      'Which field to edit?',
      createItemSelectorItems(entitySpec, changedValues, defaultValues),
      lastItemId
    );
    if (item.id === '_exit') {
      break;
    }
    lastItemId = item.id;
    const fieldName = item.id;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fieldSpec = entitySpec.fields.find((x) => x.name === fieldName)!;
    const result = await editField(context, fieldSpec, item.defaultValue);
    if (result.isOk()) {
      changedValues[fieldName] = result.value;
    } else {
      logErrorResult('Failed editing field', result);
    }
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

function getEntitySpec(
  context: SessionContext,
  entity: { _type: string; [fieldName: string]: unknown }
) {
  const { instance } = context;
  const schema = instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(entity._type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity._type}`);
  }
  return entitySpec;
}

async function replaceReferencesWithEntities(
  context: SessionContext,
  entity: { _type: string; [fieldName: string]: unknown }
) {
  const entitySpec = getEntitySpec(context, entity);
  for (const fieldSpec of entitySpec.fields) {
    if (!(fieldSpec.name in entity)) {
      continue;
    }
    const value = entity[fieldSpec.name];
    if (fieldSpec.type === EntityFieldType.Reference) {
      if (isReferenceFieldType(fieldSpec, value)) {
        if (!value || isReferenceAnEntity(value)) {
          continue;
        }
        const referenceResult = await EntityAdmin.getEntity(context, value.id, {});
        if (referenceResult.isOk()) {
          entity[fieldSpec.name] = referenceResult.value.item;
        } else {
          logErrorResult('Failed fetching reference', referenceResult);
        }
      }
    }
  }
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

async function editField(
  context: SessionContext,
  fieldSpec: EntityFieldSpecification,
  defaultValue: unknown
): PromiseResult<unknown, ErrorType> {
  if (isReferenceFieldType(fieldSpec, defaultValue)) {
    return editFieldReference(context, fieldSpec, defaultValue);
  }
  if (isStringFieldType(fieldSpec, defaultValue)) {
    return editFieldString(fieldSpec, defaultValue);
  }
  throw new Error(`Unknown type (${fieldSpec.type})`);
}

async function editFieldReference(
  context: SessionContext,
  fieldSpec: EntityFieldSpecification,
  defaultValue: { id: string } | null
) {
  return await selectEntity(context, fieldSpec.name, defaultValue);
}

async function editFieldString(fieldSpec: EntityFieldSpecification, defaultValue: string | null) {
  return ok(await showStringEdit(fieldSpec.name, defaultValue));
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
    const entity = result.value.item;
    await replaceReferencesWithEntities(context, entity);
    logEntity(context, entity);
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
