import chalk from 'chalk';
import {
  isEntityTypeField,
  isEntityTypeListField,
  isLocationField,
  isLocationListField,
  isPagingForwards,
  isRichTextField,
  isRichTextListField,
  isStringField,
  isStringListField,
  isValueTypeField,
  isValueTypeListField,
  notOk,
  ok,
  toAdminEntity2,
  toAdminEntityUpdate2,
} from '@datadata/core';
import type {
  AdminEntity,
  AdminEntity2,
  AdminEntityCreate2,
  AdminQuery,
  EntityPublishState,
  EntityReference,
  EntityTypeSpecification,
  ErrorType,
  FieldSpecification,
  Location,
  Paging,
  PromiseResult,
  RichText,
  ValueItem,
  ValueTypeSpecification,
} from '@datadata/core';
import type { CliContext } from '..';
import * as CliSchema from './CliSchema';
import {
  formatBoundingBox,
  formatEntityOneLine,
  formatErrorResult,
  formatFieldValue,
  formatLocation,
  formatRichTextOneLine,
  formatValueItemOneLine,
  getEntitySpec,
  getValueSpec,
  logEntity,
  logErrorResult,
  logKeyValue,
} from './CliUtils';
import {
  showBoundingBoxEdit,
  showConfirm,
  showIntegerEdit,
  showItemSelector,
  showLocationEdit,
  showMultiItemSelector,
  showRichTextEdit,
  showStringEdit,
} from './widgets';
import type { ItemSelectorItem } from './widgets';

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
  context: CliContext,
  message: string,
  initialQuery: AdminQuery | null,
  _defaultValue: EntityReference | null
): PromiseResult<AdminEntity, ErrorType.BadRequest | ErrorType.NotFound> {
  const { adminClient } = context;
  const { query, paging } = await configureQuery(context, initialQuery);
  const isForward = isPagingForwards(paging);

  const totalCountResult = await adminClient.getTotalCount(query);
  if (totalCountResult.isError()) {
    return totalCountResult;
  }
  logKeyValue('Total count', String(totalCountResult.value));

  let lastItemId: string | null = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await adminClient.searchEntities(query, paging);
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
          return { id: entity.id, name: formatEntityOneLine(toAdminEntity2(entity)), entity };
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
  context: CliContext,
  initialQuery: AdminQuery | null
): Promise<{ query: AdminQuery; paging: Paging }> {
  let lastItemId = '_search';
  const query: AdminQuery = initialQuery ? { ...initialQuery } : {};
  let pagingIsForward = true;
  let pagingCount = 25;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const items = [
      {
        id: '_text',
        name: `${chalk.bold('Text:')} ${query.text ? query.text : chalk.grey('<not set>')}`,
      },
      {
        id: '_entityTypes',
        name: `${chalk.bold('Entity types:')} ${
          query.entityTypes?.join(', ') ?? chalk.grey('<not set>')
        }`,
        enabled: (initialQuery?.entityTypes?.length ?? 0) === 0,
      },
      {
        id: '_boundingBox',
        name: `${chalk.bold('Bounding box:')} ${
          query.boundingBox ? formatBoundingBox(query.boundingBox) : chalk.grey('<not set>')
        }`,
      },
      {
        id: '_order',
        name: `${chalk.bold('Order:')} ${query.order ?? 'default'}`,
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
      case '_text':
        query.text = await showStringEdit('Text', query.text || '');
        break;
      case '_entityTypes':
        query.entityTypes = await CliSchema.selectEntityTypes(context);
        break;
      case '_boundingBox':
        query.boundingBox =
          (await showBoundingBoxEdit('Bounding box', query.boundingBox ?? null)) ?? undefined;
        break;
      case '_order':
        query.order = await selectOrder(query.order);
        break;
      case '_direction':
        pagingIsForward = !pagingIsForward;
        break;
      case '_count':
        pagingCount = await showIntegerEdit('How many items to show per page?', pagingCount);
        break;
      case '_search':
        return {
          query,
          paging: pagingIsForward
            ? {
                first: pagingCount,
              }
            : { last: pagingCount },
        };
    }
  }
}

async function selectOrder(order: string | undefined) {
  const item = await showItemSelector(
    'How to order the results?',
    [
      { id: 'default', name: 'Default' },
      { id: '_name', name: 'Name' },
    ],
    order ?? 'default'
  );
  if (item.id === 'default') {
    return undefined;
  }
  return item.id;
}

export async function createEntity(context: CliContext): Promise<AdminEntity2 | null> {
  const { adminClient } = context;
  const type = await CliSchema.selectEntityType(context);
  const entity: AdminEntityCreate2 = {
    info: { type, name: '' },
    fields: await editEntityValues(context, type, {}),
  };

  while (!entity.info.name) {
    entity.info.name = await showStringEdit('What name to use for the entity?');
  }

  const createResult = await adminClient.createEntity(entity);
  if (createResult.isError()) {
    logErrorResult('Failed creating entity', createResult);
    return null;
  }
  console.log(chalk.bold('Created entity'));
  logEntity(context, createResult.value);

  const publishedEntity = await publishEntityVersion(context, createResult.value);
  if (publishedEntity) {
    return publishedEntity;
  }

  return createResult.value;
}

export async function editEntity(context: CliContext, id: string): Promise<AdminEntity2 | null> {
  const { adminClient } = context;
  const getResult = await adminClient.getEntity({ id });
  if (getResult.isError()) {
    logErrorResult('Failed fetching entity data', getResult);
    return null;
  }

  const entity = {
    id,
    ...(await editEntityValues(context, getResult.value._type, getResult.value)),
  };
  const updateResult = await adminClient.updateEntity(toAdminEntityUpdate2(entity));
  if (updateResult.isError()) {
    logErrorResult('Failed updating entity', updateResult);
    return null;
  }
  console.log(chalk.bold('Updated'));
  logEntity(context, updateResult.value);

  const publishedEntity = await publishEntityVersion(context, updateResult.value);
  if (publishedEntity) {
    return publishedEntity;
  }
  return updateResult.value;
}

async function publishEntityVersion(
  context: CliContext,
  entity: AdminEntity2
): Promise<AdminEntity2 | null> {
  const { adminClient } = context;
  const publish = await showConfirm('Publish the entity?');
  if (!publish) {
    return null;
  }
  const publishResult = await adminClient.publishEntities([
    { id: entity.id, version: entity.info.version },
  ]);
  if (publishResult.isError()) {
    logErrorResult('Failed publishing entity', publishResult);
    return null;
  }

  const getResult = await adminClient.getEntity({ id: entity.id });
  if (getResult.isError()) {
    logErrorResult('Failed fetching entity', getResult);
    return null;
  }
  return toAdminEntity2(getResult.value);
}

async function editEntityValues(
  context: CliContext,
  type: string,
  defaultValues: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const entitySpec = getEntitySpec(context, type);
  const changedValues: Record<string, unknown> = {};

  let lastItemId = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const item: EditFieldSelectorItem = await showItemSelector(
      'Which field to edit?',
      createEntityFieldSelectorItems(entitySpec, changedValues, defaultValues),
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

function createEntityFieldSelectorItems(
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
  context: CliContext,
  fieldSpec: FieldSpecification,
  defaultValue: unknown
): PromiseResult<unknown, ErrorType> {
  if (isEntityTypeField(fieldSpec, defaultValue)) {
    return editFieldReference(context, fieldSpec, defaultValue);
  }
  if (isEntityTypeListField(fieldSpec, defaultValue)) {
    return editFieldReferenceList(context, fieldSpec, defaultValue);
  }
  if (isValueTypeField(fieldSpec, defaultValue)) {
    return editFieldValueItem(context, fieldSpec, defaultValue);
  }
  if (isValueTypeListField(fieldSpec, defaultValue)) {
    return editFieldValueTypeList(context, fieldSpec, defaultValue);
  }
  if (isStringField(fieldSpec, defaultValue)) {
    return editFieldString(fieldSpec, defaultValue);
  }
  if (isStringListField(fieldSpec, defaultValue)) {
    return editFieldStringList(fieldSpec, defaultValue);
  }
  if (isRichTextField(fieldSpec, defaultValue)) {
    return editFieldRichText(context, fieldSpec, defaultValue);
  }
  if (isRichTextListField(fieldSpec, defaultValue)) {
    return editFieldRichTextList(context, fieldSpec, defaultValue);
  }
  if (isLocationField(fieldSpec, defaultValue)) {
    return editFieldLocation(fieldSpec, defaultValue);
  }
  if (isLocationListField(fieldSpec, defaultValue)) {
    return editFieldLocationList(fieldSpec, defaultValue);
  }
  throw new Error(`Unknown type (${fieldSpec.type})`);
}

async function editFieldReference(
  context: CliContext,
  fieldSpec: FieldSpecification,
  defaultValue: EntityReference | null
) {
  return await selectEntity(
    context,
    fieldSpec.name,
    { entityTypes: fieldSpec.entityTypes },
    defaultValue
  );
}

async function editFieldReferenceList(
  context: CliContext,
  fieldSpec: FieldSpecification,
  defaultValue: EntityReference[] | null
) {
  // TODO display cached entity info
  return await editFieldList(
    fieldSpec,
    'Select reference item',
    defaultValue,
    (item) => item.id,
    (item) => editFieldReference(context, fieldSpec, item)
  );
}

export async function editFieldValueItem(
  context: CliContext,
  fieldSpec: FieldSpecification,
  defaultValue: ValueItem | null
): PromiseResult<ValueItem, ErrorType.BadRequest> {
  //TODO which error type
  const valueItem = defaultValue
    ? { ...defaultValue }
    : { _type: await CliSchema.selectValueType(context, fieldSpec.valueTypes) };
  const valueSpec = getValueSpec(context, valueItem);

  let lastItemId = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const item: EditFieldSelectorItem = await showItemSelector(
      'Which field to edit?',
      createValueItemFieldSelectorItems(valueSpec, valueItem),
      lastItemId
    );
    if (item.id === '_exit') {
      break;
    }
    lastItemId = item.id;
    const fieldName = item.id;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fieldSpec = valueSpec.fields.find((x) => x.name === fieldName)!;
    const result = await editField(context, fieldSpec, item.defaultValue);
    if (result.isOk()) {
      valueItem[fieldName] = result.value;
    } else {
      logErrorResult('Failed editing field', result);
    }
  }

  return ok(valueItem);
}

function createValueItemFieldSelectorItems(
  valueSpec: ValueTypeSpecification,
  valueItem: ValueItem
): EditFieldSelectorItem[] {
  const items: EditFieldSelectorItem[] = [];
  for (const fieldSpec of valueSpec.fields) {
    const value = valueItem[fieldSpec.name];
    items.push({
      id: fieldSpec.name,
      name: `${chalk.bold(fieldSpec.name)}: ${formatFieldValue(fieldSpec, value)}`,
      defaultValue: value,
    });
  }
  items.push({ id: '_exit', name: 'Done' });
  return items;
}

async function editFieldValueTypeList(
  context: CliContext,
  fieldSpec: FieldSpecification,
  defaultValue: ValueItem[] | null
) {
  return await editFieldList(
    fieldSpec,
    'Select value item',
    defaultValue,
    (item) => formatValueItemOneLine(item),
    (item) => editFieldValueItem(context, fieldSpec, item)
  );
}

async function editFieldString(fieldSpec: FieldSpecification, defaultValue: string | null) {
  return ok(await showStringEdit(fieldSpec.name, defaultValue));
}

async function editFieldStringList(fieldSpec: FieldSpecification, defaultValue: string[] | null) {
  return await editFieldList(
    fieldSpec,
    'Select string item',
    defaultValue,
    (item) => item,
    (item) => editFieldString(fieldSpec, item)
  );
}

async function editFieldRichText(
  context: CliContext,
  fieldSpec: FieldSpecification,
  defaultValue: RichText | null
) {
  return ok(await showRichTextEdit(context, fieldSpec, fieldSpec.name, defaultValue));
}

async function editFieldRichTextList(
  context: CliContext,
  fieldSpec: FieldSpecification,
  defaultValue: RichText[] | null
) {
  return await editFieldList(
    fieldSpec,
    'Select rich text item',
    defaultValue,
    (item) => formatRichTextOneLine(item),
    (item) => editFieldRichText(context, fieldSpec, item)
  );
}

async function editFieldLocation(fieldSpec: FieldSpecification, defaultValue: Location | null) {
  return ok(await showLocationEdit(fieldSpec.name, defaultValue));
}

async function editFieldLocationList(
  fieldSpec: FieldSpecification,
  defaultValue: Location[] | null
) {
  return await editFieldList(
    fieldSpec,
    'Select location item',
    defaultValue,
    (item) => formatLocation(item),
    (item) => editFieldLocation(fieldSpec, item)
  );
}

async function editFieldList<TItem>(
  fieldSpec: FieldSpecification,
  message: string,
  defaultValue: TItem[] | null,
  formatItem: (item: TItem) => string,
  editItem: (item: TItem | null) => PromiseResult<TItem | null, ErrorType>
) {
  let exit = false;
  const result = defaultValue ? [...defaultValue] : [];
  let lastItemId: string | null = null;
  while (!exit) {
    const items = [
      ...result.map((x, index) => ({ id: String(index), name: `${index + 1}: ${formatItem(x)}` })),
      { id: '_add', name: 'Add' },
      { id: '_remove', name: 'Remove', enabled: result.length > 0 },
      { id: '_done', name: 'Done' },
    ];
    const item: ItemSelectorItem = await showItemSelector(message, items, lastItemId);
    lastItemId = item.id;
    if (item.id === '_done') {
      exit = true;
    } else if (item.id === '_add') {
      const newItem = await editItem(null);
      if (newItem.isOk() && newItem.value !== null) {
        result.push(newItem.value);
      }
    } else if (item.id === '_remove') {
      const itemsToRemove = await showMultiItemSelector(
        'Which items to remove?',
        result.map((x, index) => ({ id: String(index), name: `${index + 1}: ${formatItem(x)}` }))
      );
      for (const item of itemsToRemove.reverse()) {
        result.splice(Number.parseInt(item.id), 1);
      }
    } else {
      const index = Number.parseInt(item.id);
      const editedItem = await editItem(result[index]);
      if (editedItem.isOk()) {
        if (editedItem.value !== null) {
          result[index] = editedItem.value;
        } else {
          result.splice(index, 1);
        }
      }
    }
  }
  return ok(result);
}

export async function publishEntity(
  context: CliContext,
  id: string
): Promise<EntityPublishState | null> {
  const { adminClient } = context;
  const version = await selectEntityVersion(context, 'Which version to publish?', id, null);

  if (version === null) {
    return null;
  }

  const publishResult = await adminClient.publishEntities([{ id, version }]);
  if (publishResult.isError()) {
    logErrorResult('Failed publishing entity', publishResult);
    return null;
  }
  const { publishState } = publishResult.value[0];
  console.log(`${chalk.bold('Published:')} ${id} version: ${version}`);
  return publishState;
}

export async function unpublishEntity(
  context: CliContext,
  id: string
): Promise<EntityPublishState | null> {
  const { adminClient } = context;
  const unpublishResult = await adminClient.unpublishEntities([{ id }]);
  if (unpublishResult.isError()) {
    logErrorResult('Failed unpublishing entity', unpublishResult);
    return null;
  }
  const { publishState } = unpublishResult.value[0];
  console.log(`${chalk.bold('Unpublished:')} ${id} (${publishState})`);
  return publishState;
}

export async function archiveEntity(
  context: CliContext,
  id: string
): Promise<EntityPublishState | null> {
  const { adminClient } = context;
  const archiveResult = await adminClient.archiveEntity({ id });
  if (archiveResult.isError()) {
    logErrorResult('Failed archiving entity', archiveResult);
    return null;
  }
  const { publishState } = archiveResult.value;
  console.log(`${chalk.bold('Archived:')} ${id}`);
  return publishState;
}

export async function unarchiveEntity(
  context: CliContext,
  id: string
): Promise<EntityPublishState | null> {
  const { adminClient } = context;
  const unarchiveResult = await adminClient.unarchiveEntity({ id });
  if (unarchiveResult.isError()) {
    logErrorResult('Failed unarchiving entity', unarchiveResult);
    return null;
  }
  const { publishState } = unarchiveResult.value;
  console.log(`${chalk.bold('Unarchived:')} ${id}`);
  return publishState;
}

export async function showEntityHistory(context: CliContext, id: string): Promise<void> {
  const { adminClient } = context;
  const result = await adminClient.getEntityHistory({ id });
  if (result.isError()) {
    logErrorResult('Failed retrieving history', result);
    return;
  }
  const history = result.value;
  logKeyValue('id', history.id);
  for (const version of history.versions) {
    const tags = [];
    if (version.published) tags.push(chalk.green('published'));
    logKeyValue('version', `${version.version} ${tags.join(', ')}`);
    logKeyValue('  created by', version.createdBy);
    logKeyValue('  created at', version.createdAt.toISOString());
  }
}

export async function showPublishingHistory(context: CliContext, id: string): Promise<void> {
  const { adminClient } = context;
  const result = await adminClient.getPublishingHistory({ id });
  if (result.isError()) {
    logErrorResult('Failed retrieving history', result);
    return;
  }
  const history = result.value;
  logKeyValue('id', history.id);
  for (const event of history.events) {
    console.log(chalk.bold(event.kind));
    if (event.version !== null) {
      logKeyValue('  version', event.version.toString());
    }
    logKeyValue('  published by', event.publishedBy);
    logKeyValue('  published at', event.publishedAt.toISOString());
  }
}

export async function showLatestEntity(context: CliContext, id: string): Promise<void> {
  const { adminClient } = context;
  const result = await adminClient.getEntity({ id });
  if (result.isOk()) {
    const entity = result.value;
    logEntity(context, toAdminEntity2(entity));

    const totalResult = await adminClient.getTotalCount({ referencing: id });
    if (totalResult.isError()) {
      logErrorResult('Failed getting items referencing this entity', totalResult);
    } else if (totalResult.value > 0) {
      console.log();
      logKeyValue('Entities referencing this entity', String(totalResult.value));
      const referencesResult = await adminClient.searchEntities({ referencing: id });
      if (referencesResult.isError()) {
        logErrorResult('Failed searching references', referencesResult);
      } else if (referencesResult.value) {
        for (const edge of referencesResult.value?.edges) {
          if (edge.node.isOk()) {
            console.log(formatEntityOneLine(toAdminEntity2(edge.node.value)));
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
  context: CliContext,
  message: string,
  id: string,
  defaultVersion: number | null
): Promise<number | null> {
  const { adminClient } = context;
  const result = await adminClient.getEntityHistory({ id });
  if (result.isError()) {
    logErrorResult('Failed retrieving history', result);
    return null;
  }

  const defaultItemId = typeof defaultVersion === 'number' ? String(defaultVersion) : undefined;
  const versionItems = result.value.versions
    .map((version) => {
      const tags = [];
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

export async function showEntityVersion(context: CliContext, id: string): Promise<void> {
  const { adminClient } = context;
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
    const result = await adminClient.getEntity({ id, version: currentVersion });
    if (result.isOk()) {
      logEntity(context, toAdminEntity2(result.value));
    } else {
      logErrorResult('Failed getting entity version', result);
    }
  }
}
