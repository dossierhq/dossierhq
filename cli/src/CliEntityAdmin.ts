import chalk from 'chalk';
import {
  EntityAdmin,
  ErrorType,
  isPagingForwards,
  isReferenceFieldType,
  isStringFieldType,
  notOk,
  ok,
} from '@datadata/core';
import type {
  AdminEntity,
  AdminFilter,
  EntityFieldSpecification,
  EntityTypeSpecification,
  Paging,
  PromiseResult,
  SessionContext,
} from '@datadata/core';
import * as CliSchema from './CliSchema';
import {
  formatEntityOneLine,
  formatErrorResult,
  formatFieldValue,
  getEntitySpec,
  logEntity,
  logErrorResult,
  logKeyValue,
  replaceReferencesWithEntitiesGeneric,
} from './CliUtils';
import type { ItemSelectorItem } from './widgets';
import { showConfirm, showIntegerEdit, showItemSelector, showStringEdit } from './widgets';

interface EditFieldSelectorItem extends ItemSelectorItem {
  defaultValue?: unknown;
}

interface EntitySelectorItem {
  id: string;
  name: string;
  entity?: AdminEntity;
  enabled?: boolean;
}

export async function selectEntity(
  context: SessionContext,
  message: string,
  initialFilter: AdminFilter | null,
  unusedDefaultValue: { id: string } | null
): PromiseResult<AdminEntity, ErrorType.BadRequest | ErrorType.NotFound> {
  const { filter, paging } = await configureQuery(context, initialFilter);
  const isForward = isPagingForwards(paging);

  const totalCountResult = await EntityAdmin.getTotalCount(context, filter);
  if (totalCountResult.isError()) {
    return totalCountResult;
  }
  logKeyValue('Total count', String(totalCountResult.value));

  let lastItemId: string | null = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await EntityAdmin.searchEntities(context, filter, paging);
    if (result.isError()) {
      return result;
    }
    if (result.value === null) {
      return notOk.NotFound('No entries found');
    }

    const items = [
      ...result.value.edges.map((edge) => {
        if (edge.node.isOk()) {
          const entity = edge.node.value;
          return { id: entity.id, name: formatEntityOneLine(entity), entity };
        }
        return { id: edge.cursor, name: formatErrorResult(edge.node), enabled: false };
      }),
      {
        id: '_next',
        name: isForward ? 'Next page' : 'Previous page',
        enabled: isForward
          ? result.value.pageInfo.hasNextPage
          : result.value.pageInfo.hasPreviousPage,
      },
    ];
    const item: EntitySelectorItem = await showItemSelector<EntitySelectorItem>(
      message,
      items,
      lastItemId
    );
    lastItemId = item.id;

    if (item.entity) {
      return ok(item.entity);
    }
    if (item.id === '_next') {
      if (isForward) {
        paging.after = result.value.pageInfo.endCursor;
      } else {
        paging.before = result.value.pageInfo.startCursor;
      }
    }
  }
}

async function configureQuery(
  context: SessionContext,
  initialFilter: AdminFilter | null
): Promise<{ filter: AdminFilter; paging: Paging }> {
  let lastItemId = '_search';
  const filter: AdminFilter = initialFilter ? { ...initialFilter } : {};
  let pagingIsForward = true;
  let pagingCount = 25;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const items = [
      {
        id: '_entityTypes',
        name: `${chalk.bold('Entity types:')} ${
          filter.entityTypes?.join(', ') ?? chalk.grey('<not set>')
        }`,
        enabled: (initialFilter?.entityTypes?.length ?? 0) === 0,
      },
      {
        id: '_direction',
        name: `${chalk.bold('Direction:')} ${pagingIsForward ? 'forward' : 'backward'}`,
      },
      { id: '_count', name: `${chalk.bold('Page size:')} ${pagingCount}` },
      { id: '_search', name: 'Search' },
    ];
    const item = await showItemSelector('Configure the search', items, lastItemId);
    lastItemId = item.id;

    switch (item.id) {
      case '_entityTypes':
        filter.entityTypes = await CliSchema.selectEntityTypes(context);
        break;
      case '_direction':
        pagingIsForward = !pagingIsForward;
        break;
      case '_count':
        pagingCount = await showIntegerEdit('How many items to show per page?', pagingCount);
        break;
      case '_search':
        return {
          filter,
          paging: pagingIsForward
            ? {
                first: pagingCount,
              }
            : { last: pagingCount },
        };
    }
  }
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
  console.log(`${chalk.bold('Updated:')} ${id} (version: ${updateResult.value._version})`);
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
  return await selectEntity(
    context,
    fieldSpec.name,
    { entityTypes: fieldSpec.entityTypes },
    defaultValue
  );
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
  console.log(`${chalk.bold('Deleted:')} ${id} (version: ${result.value._version})`);
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
    if (version.deleted) tags.push(chalk.red('deleted'));
    if (version.published) tags.push(chalk.green('published'));
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

    const totalResult = await EntityAdmin.getTotalCount(context, { referencing: id });
    if (totalResult.isError()) {
      logErrorResult('Failed getting items referencing this entity', totalResult);
    } else if (totalResult.value > 0) {
      console.log();
      logKeyValue('Entities referencing this entity', String(totalResult.value));
      const referencesResult = await EntityAdmin.searchEntities(context, { referencing: id });
      if (referencesResult.isError()) {
        logErrorResult('Failed searching references', referencesResult);
      } else if (referencesResult.value) {
        for (const edge of referencesResult.value?.edges) {
          if (edge.node.isOk()) {
            console.log(formatEntityOneLine(edge.node.value));
          } else {
            logErrorResult('', edge.node);
          }
        }
      }
    }
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
      if (version.deleted) tags.push(chalk.red('deleted'));
      if (version.published) tags.push(chalk.green('published'));
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

async function replaceReferencesWithEntities(
  context: SessionContext,
  entity: { _type: string; [fieldName: string]: unknown }
) {
  await replaceReferencesWithEntitiesGeneric(context, entity, async (context, id) => {
    return await EntityAdmin.getEntity(context, id, {});
  });
}
