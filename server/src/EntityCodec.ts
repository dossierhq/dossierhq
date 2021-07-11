import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  Entity,
  EntityTypeSpecification,
  ErrorType,
  FieldSpecification,
  Location,
  PromiseResult,
  Result,
  RichText,
  Schema,
  ValueItem,
} from '@datadata/core';
import {
  EntityPublishState,
  FieldType,
  isLocationItemField,
  isRichTextEntityBlock,
  isRichTextField,
  isRichTextItemField,
  isRichTextParagraphBlock,
  isStringItemField,
  isRichTextValueItemBlock,
  isValueTypeField,
  isValueTypeItemField,
  notOk,
  ok,
  RichTextBlockType,
  visitItemRecursively,
  visitorPathToString,
} from '@datadata/core';
import type { SessionContext } from '.';
import { ensureRequired } from './Assertions';
import * as Db from './Database';
import type { EntitiesTable, EntityVersionsTable } from './DatabaseTables';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters';

export type AdminEntityValues = Pick<
  EntitiesTable,
  | 'uuid'
  | 'type'
  | 'name'
  | 'never_published'
  | 'archived'
  | 'latest_draft_entity_versions_id'
  | 'published_entity_versions_id'
> &
  Pick<EntityVersionsTable, 'data' | 'version'>;

export type EntityValues = Pick<EntitiesTable, 'uuid' | 'type' | 'name'> &
  Pick<EntityVersionsTable, 'data'>;

interface EncodeEntityResult {
  type: string;
  name: string;
  data: Record<string, unknown>;
  referenceIds: number[];
  locations: Location[];
  fullTextSearchText: string[];
}

interface EncodedRichTextBlock {
  t: string;
  d: unknown;
}

interface RequestedReference {
  prefix: string;
  uuids: string[];
  entityTypes: string[] | undefined;
}

export function decodePublishedEntity(context: SessionContext, values: EntityValues): Entity {
  const schema = context.server.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    throw new Error(`No entity spec for type ${values.type}`);
  }
  const entity: Entity = {
    id: values.uuid,
    info: { type: values.type, name: values.name },
    fields: {},
  };
  for (const fieldSpec of entitySpec.fields) {
    const { name: fieldName } = fieldSpec;
    const fieldValue = values.data[fieldName];
    entity.fields[fieldName] = decodeFieldItemOrList(schema, fieldSpec, fieldValue);
  }
  return entity;
}

function decodeFieldItemOrList(schema: Schema, fieldSpec: FieldSpecification, fieldValue: unknown) {
  if (fieldValue === null || fieldValue === undefined) {
    return null;
  }
  const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
  if (fieldSpec.list) {
    if (!Array.isArray(fieldValue)) {
      throw new Error(`Expected list but got ${fieldValue} (${fieldSpec.name})`);
    }
    const decodedItems: unknown[] = [];
    for (const encodedItem of fieldValue) {
      if (fieldSpec.type === FieldType.ValueType) {
        const decodedItem = decodeValueItemField(schema, fieldSpec, encodedItem);
        decodedItems.push(decodedItem);
      } else if (fieldSpec.type === FieldType.RichText) {
        decodedItems.push(decodeRichTextField(schema, fieldSpec, encodedItem));
      } else {
        decodedItems.push(fieldAdapter.decodeData(encodedItem));
      }
    }
    return decodedItems;
  }
  if (fieldSpec.type === FieldType.ValueType) {
    return decodeValueItemField(schema, fieldSpec, fieldValue as ValueItem);
  }
  if (fieldSpec.type === FieldType.RichText) {
    return decodeRichTextField(schema, fieldSpec, fieldValue as EncodedRichTextBlock[]);
  }
  return fieldAdapter.decodeData(fieldValue);
}

function decodeValueItemField(
  schema: Schema,
  fieldSpec: FieldSpecification,
  encodedValue: { _type: string; [key: string]: unknown }
) {
  const valueSpec = schema.getValueTypeSpecification(encodedValue._type);
  if (!valueSpec) {
    throw new Error(`Couldn't find spec for value type ${encodedValue._type}`);
  }
  const decodedValue: ValueItem = { _type: encodedValue._type };
  for (const [fieldName, fieldValue] of Object.entries(encodedValue)) {
    if (fieldName === '_type') {
      continue;
    }

    const fieldSpec = schema.getValueFieldSpecification(valueSpec, fieldName);
    if (!fieldSpec) {
      throw new Error(`No field spec for ${fieldName} in value spec ${encodedValue._type}`);
    }
    decodedValue[fieldName] = decodeFieldItemOrList(schema, fieldSpec, fieldValue);
  }

  return decodedValue;
}

function decodeRichTextField(
  schema: Schema,
  fieldSpec: FieldSpecification,
  encodedValue: EncodedRichTextBlock[]
): RichText {
  const decodedBlocks = encodedValue.map((block) => {
    const { t: type, d: encodedData } = block;
    let decodedData = encodedData;
    if (type === RichTextBlockType.valueItem && encodedData) {
      decodedData = decodeValueItemField(schema, fieldSpec, encodedData as ValueItem);
    } else if (type === RichTextBlockType.entity && encodedData) {
      const adapter = EntityFieldTypeAdapters.getAdapterForType(FieldType.EntityType);
      decodedData = adapter.decodeData(encodedData);
    }
    return {
      type,
      data: decodedData,
    };
  });
  return { blocks: decodedBlocks };
}

export function decodeAdminEntity(context: SessionContext, values: AdminEntityValues): AdminEntity {
  const schema = context.server.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    throw new Error(`No entity spec for type ${values.type}`);
  }

  const state = resolvePublishState(values, values);

  const entity: AdminEntity = {
    id: values.uuid,
    info: {
      type: values.type,
      name: values.name,
      version: values.version,
      publishingState: state,
    },
    fields: {},
  };
  for (const fieldSpec of entitySpec.fields) {
    const { name: fieldName } = fieldSpec;
    const fieldValue = values.data[fieldName];
    entity.fields[fieldName] = decodeFieldItemOrList(schema, fieldSpec, fieldValue);
  }
  return entity;
}

export function resolvePublishState(
  values: Pick<EntitiesTable, 'archived' | 'never_published' | 'published_entity_versions_id'>,
  draft: 'is-update' | Pick<EntitiesTable, 'latest_draft_entity_versions_id'>
): EntityPublishState {
  if (values.archived) {
    return EntityPublishState.Archived;
  }
  if (values.published_entity_versions_id === null) {
    return values.never_published ? EntityPublishState.Draft : EntityPublishState.Withdrawn;
  }
  if (
    draft === 'is-update' ||
    values.published_entity_versions_id !== draft.latest_draft_entity_versions_id
  ) {
    return EntityPublishState.Modified;
  }
  return EntityPublishState.Published;
}

export function resolveCreateEntity(
  context: SessionContext,
  entity: AdminEntityCreate
): Result<AdminEntityCreate, ErrorType.BadRequest> {
  if (!entity.info.type) {
    return notOk.BadRequest('Missing entity.info.type');
  }
  if (entity.info.version && entity.info.version !== 0) {
    return notOk.BadRequest(`Unsupported version for create: ${entity.info.version}`);
  }

  const result: AdminEntityCreate = {
    info: {
      name: entity.info.name,
      type: entity.info.type,
      version: 0,
    },
    fields: {},
  };

  const schema = context.server.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(result.info.type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${result.info.type} doesn’t exist`);
  }

  const unsupportedFieldsResult = checkForUnsupportedFields(entitySpec, entity);
  if (unsupportedFieldsResult.isError()) {
    return unsupportedFieldsResult;
  }

  const fields: Record<string, unknown> = {};
  for (const fieldSpec of entitySpec.fields) {
    fields[fieldSpec.name] = entity.fields?.[fieldSpec.name] ?? null;
  }
  result.fields = fields;

  return ok(result);
}

export function resolveUpdateEntity(
  context: SessionContext,
  entity: AdminEntityUpdate,
  type: string,
  values: Pick<
    EntitiesTable,
    'archived' | 'name' | 'never_published' | 'published_entity_versions_id'
  > &
    Pick<EntityVersionsTable, 'data' | 'version'>
): Result<AdminEntity, ErrorType.BadRequest> {
  if (entity.info?.type && entity.info.type !== type) {
    return notOk.BadRequest(
      `New type ${entity.info.type} doesn’t correspond to previous type ${type}`
    );
  }

  const state = resolvePublishState(values, 'is-update');

  const result: AdminEntity = {
    id: entity.id,
    info: {
      name: entity.info?.name ?? values.name,
      type: type,
      version: values.version + 1,
      publishingState: state,
    },
    fields: {},
  };

  const schema = context.server.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(result.info.type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${result.info.type} doesn’t exist`);
  }

  const unsupportedFieldsResult = checkForUnsupportedFields(entitySpec, entity);
  if (unsupportedFieldsResult.isError()) {
    return unsupportedFieldsResult;
  }

  for (const fieldSpec of entitySpec.fields) {
    const fieldName = fieldSpec.name;
    if (entity.fields && fieldName in entity.fields) {
      result.fields[fieldName] = entity.fields[fieldName];
    } else if (fieldName in values.data) {
      const encodedData = values.data[fieldName];
      result.fields[fieldName] = decodeFieldItemOrList(schema, fieldSpec, encodedData);
    } else {
      result.fields[fieldName] = null;
    }
  }

  return ok(result);
}

function checkForUnsupportedFields(
  entitySpec: EntityTypeSpecification,
  entity: AdminEntityCreate | AdminEntityUpdate
): Result<void, ErrorType.BadRequest> {
  if (!entity.fields) {
    return ok(undefined);
  }

  const unsupportedFieldNames = new Set(Object.keys(entity.fields));

  entitySpec.fields.forEach((it) => unsupportedFieldNames.delete(it.name));

  if (unsupportedFieldNames.size > 0) {
    return notOk.BadRequest(`Unsupported field names: ${[...unsupportedFieldNames].join(', ')}`);
  }
  return ok(undefined);
}

export async function encodeEntity(
  context: SessionContext,
  entity: AdminEntity | AdminEntityCreate
): PromiseResult<EncodeEntityResult, ErrorType.BadRequest> {
  const assertion = ensureRequired({
    'entity.info.type': entity.info.type,
    'entity.info.name': entity.info.name,
  });
  if (assertion.isError()) {
    return assertion;
  }

  const { type, name } = entity.info;

  const schema = context.server.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${type} doesn’t exist`);
  }

  const result: EncodeEntityResult = {
    type,
    name,
    data: {},
    referenceIds: [],
    locations: [],
    fullTextSearchText: [],
  };
  for (const fieldSpec of entitySpec.fields) {
    if (entity.fields && fieldSpec.name in entity.fields) {
      const data = entity.fields[fieldSpec.name];
      if (data === null || data === undefined) {
        continue;
      }
      const prefix = `entity.fields.${fieldSpec.name}`;
      const encodeResult = encodeFieldItemOrList(schema, fieldSpec, prefix, data);
      if (encodeResult.isError()) {
        return encodeResult;
      }
      result.data[fieldSpec.name] = encodeResult.value;
    }
  }

  const { requestedReferences, locations, fullTextSearchText } = collectDataFromEntity(
    context,
    entity
  );
  const resolveResult = await resolveRequestedEntityReferences(context, requestedReferences);
  if (resolveResult.isError()) {
    return resolveResult;
  }

  result.referenceIds.push(...resolveResult.value);
  result.locations.push(...locations);
  result.fullTextSearchText.push(...fullTextSearchText);

  return ok(result);
}

function encodeFieldItemOrList(
  schema: Schema,
  fieldSpec: FieldSpecification,
  prefix: string,
  data: unknown
): Result<unknown, ErrorType.BadRequest> {
  const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
  if (fieldSpec.list) {
    if (!Array.isArray(data)) {
      return notOk.BadRequest(`${prefix}: expected list`);
    }
    const encodedItems: unknown[] = [];
    for (const decodedItem of data) {
      let encodedItemResult;
      if (isValueTypeItemField(fieldSpec, decodedItem)) {
        encodedItemResult = encodeValueItemField(schema, fieldSpec, prefix, decodedItem);
      } else if (isRichTextItemField(fieldSpec, decodedItem)) {
        encodedItemResult = encodeRichTextField(schema, fieldSpec, prefix, decodedItem);
      } else {
        encodedItemResult = fieldAdapter.encodeData(prefix, decodedItem);
      }
      if (encodedItemResult.isError()) {
        return encodedItemResult;
      }
      encodedItems.push(encodedItemResult.value);
    }
    return ok(encodedItems);
  }

  if (isValueTypeField(fieldSpec, data)) {
    return encodeValueItemField(schema, fieldSpec, prefix, data);
  } else if (isRichTextField(fieldSpec, data)) {
    return encodeRichTextField(schema, fieldSpec, prefix, data);
  }
  return fieldAdapter.encodeData(prefix, data);
}

function encodeValueItemField(
  schema: Schema,
  fieldSpec: FieldSpecification,
  prefix: string,
  data: ValueItem | null
): Result<unknown, ErrorType.BadRequest> {
  if (Array.isArray(data)) {
    return notOk.BadRequest(`${prefix}: expected single value, got list`);
  }
  if (typeof data !== 'object' || !data) {
    return notOk.BadRequest(`${prefix}: expected object, got ${typeof data}`);
  }
  const value = data as ValueItem;
  const valueType = value._type;
  if (!valueType) {
    return notOk.BadRequest(`${prefix}: missing _type`);
  }
  const valueSpec = schema.getValueTypeSpecification(valueType);
  if (!valueSpec) {
    return notOk.BadRequest(`${prefix}: value type ${valueType} doesn’t exist`);
  }
  if (
    fieldSpec.valueTypes &&
    fieldSpec.valueTypes.length > 0 &&
    fieldSpec.valueTypes.indexOf(valueType) < 0
  ) {
    return notOk.BadRequest(`${prefix}: value of type ${valueType} is not allowed`);
  }

  const unsupportedFields = new Set(Object.keys(value));
  unsupportedFields.delete('_type');
  valueSpec.fields.forEach((x) => unsupportedFields.delete(x.name));
  if (unsupportedFields.size > 0) {
    return notOk.BadRequest(
      `${prefix}: Unsupported field names: ${[...unsupportedFields].join(', ')}`
    );
  }

  const encodedValue: ValueItem = { _type: valueType };

  for (const fieldSpec of valueSpec.fields) {
    const fieldValue = value[fieldSpec.name];
    if (fieldValue === null || fieldValue === undefined) {
      continue;
    }
    const encodedField = encodeFieldItemOrList(
      schema,
      fieldSpec,
      `${prefix}.${fieldSpec.name}`,
      fieldValue
    );
    if (encodedField.isError()) {
      return encodedField;
    }
    encodedValue[fieldSpec.name] = encodedField.value;
  }

  return ok(encodedValue);
}

function encodeRichTextField(
  schema: Schema,
  fieldSpec: FieldSpecification,
  prefix: string,
  data: RichText | null
): Result<unknown, ErrorType.BadRequest> {
  if (Array.isArray(data)) {
    return notOk.BadRequest(`${prefix}: expected single value, got list`);
  }
  if (typeof data !== 'object' || !data) {
    return notOk.BadRequest(`${prefix}: expected object, got ${typeof data}`);
  }
  const { blocks, ...unexpectedData } = data;
  if (!blocks) {
    return notOk.BadRequest(`${prefix}: missing blocks`);
  }
  if (!Array.isArray(blocks)) {
    return notOk.BadRequest(`${prefix}.blocks: expected array, got ${typeof blocks}`);
  }

  if (Object.keys(unexpectedData).length > 0) {
    return notOk.BadRequest(`${prefix}: unexpected keys ${Object.keys(unexpectedData).join(', ')}`);
  }

  const encodedBlocks: EncodedRichTextBlock[] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const blockPrefix = `${prefix}[${i}]`;
    const block = blocks[i];
    const { type, data, ...unexpectedBlockData } = block;
    if (
      fieldSpec.richTextBlocks &&
      fieldSpec.richTextBlocks.length > 0 &&
      !fieldSpec.richTextBlocks.find((x) => x.type === type)
    ) {
      return notOk.BadRequest(`${blockPrefix}: rich text block of type ${type} is not allowed`);
    }

    if (Object.keys(unexpectedBlockData).length > 0) {
      return notOk.BadRequest(
        `${blockPrefix}: unexpected keys ${Object.keys(unexpectedBlockData).join(', ')}`
      );
    }

    let encodedBlockData = data;
    if (isRichTextValueItemBlock(block) && data) {
      const encodeResult = encodeValueItemField(schema, fieldSpec, blockPrefix, block.data);
      if (encodeResult.isError()) {
        return encodeResult;
      }
      encodedBlockData = encodeResult.value;
    } else if (isRichTextEntityBlock(block) && data) {
      const adapter = EntityFieldTypeAdapters.getAdapterForType(FieldType.EntityType);
      const encodeResult = adapter.encodeData(blockPrefix, block.data);
      if (encodeResult.isError()) {
        return encodeResult;
      }
      encodedBlockData = encodeResult.value;
    }

    encodedBlocks.push({ t: type, d: encodedBlockData });
  }

  return ok(encodedBlocks);
}

function collectDataFromEntity(
  context: SessionContext,
  entity: AdminEntity | AdminEntityCreate
): {
  requestedReferences: RequestedReference[];
  locations: Location[];
  fullTextSearchText: string[];
} {
  const requestedReferences: RequestedReference[] = [];
  const locations: Location[] = [];
  const fullTextSearchText: string[] = [];

  visitItemRecursively({
    schema: context.server.getSchema(),
    item: entity as AdminEntity,
    path: ['entity'],
    visitField: (path, fieldSpec, data, _visitContext) => {
      if (fieldSpec.type !== FieldType.ValueType && fieldSpec.type !== FieldType.RichText) {
        const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
        const uuids = fieldAdapter.getReferenceUUIDs(data);
        if (uuids && uuids.length > 0) {
          requestedReferences.push({
            prefix: visitorPathToString(path),
            uuids,
            entityTypes: fieldSpec.entityTypes,
          });
        }
      }

      if (isLocationItemField(fieldSpec, data) && data) {
        locations.push(data);
      } else if (isStringItemField(fieldSpec, data) && data) {
        fullTextSearchText.push(data);
      }
    },
    visitRichTextBlock: (path, fieldSpec, block, _visitContext) => {
      if (isRichTextEntityBlock(block) && block.data) {
        requestedReferences.push({
          prefix: visitorPathToString(path),
          uuids: [block.data.id],
          entityTypes: fieldSpec.entityTypes,
        });
      } else if (isRichTextParagraphBlock(block)) {
        const text = block.data.text;
        if (text) {
          fullTextSearchText.push(text);
        }
      } else if (isRichTextValueItemBlock(block)) {
        // skip since visitField will be called
      } else {
        extractFullTextValuesRecursively(block.data, fullTextSearchText);
      }
    },
    initialVisitContext: undefined,
  });

  return { requestedReferences, locations, fullTextSearchText };
}

function extractFullTextValuesRecursively(node: unknown, fullTextSearchText: string[]) {
  if (!node) {
    return;
  }

  switch (typeof node) {
    case 'bigint':
      fullTextSearchText.push(String(node));
      break;
    case 'number':
      fullTextSearchText.push(String(node));
      break;
    case 'object':
      if (node) {
        Object.values(node).forEach((it) =>
          extractFullTextValuesRecursively(it, fullTextSearchText)
        );
      }
      break;
    case 'string':
      fullTextSearchText.push(node);
      break;
  }
}

async function resolveRequestedEntityReferences(
  context: SessionContext,
  requestedReferences: RequestedReference[]
): PromiseResult<number[], ErrorType.BadRequest> {
  const allUUIDs = new Set();
  requestedReferences.forEach(({ uuids }) => uuids.forEach((uuid) => allUUIDs.add(uuid)));

  if (allUUIDs.size === 0) {
    return ok([]);
  }

  const items = await Db.queryMany<Pick<EntitiesTable, 'id' | 'type' | 'uuid'>>(
    context,
    'SELECT id, uuid, type FROM entities WHERE uuid = ANY($1)',
    [[...allUUIDs]]
  );

  for (const request of requestedReferences) {
    for (const uuid of request.uuids) {
      const item = items.find((x) => x.uuid === uuid);
      if (!item) {
        return notOk.BadRequest(`${request.prefix}: referenced entity (${uuid}) doesn’t exist`);
      }
      if (request.entityTypes && request.entityTypes.length > 0) {
        if (request.entityTypes.indexOf(item.type) < 0) {
          return notOk.BadRequest(
            `${request.prefix}: referenced entity (${uuid}) has an invalid type ${item.type}`
          );
        }
      }
    }
  }

  return ok(items.map(({ id }) => id));
}

export const forTest = {
  collectDataFromEntity,
};
