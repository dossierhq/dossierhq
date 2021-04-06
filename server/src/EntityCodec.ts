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
  Value,
} from '@datadata/core';
import {
  FieldType,
  isLocationItemField,
  isRichTextEntityBlock,
  isRichTextField,
  isRichTextItemField,
  isRichTextValueItemBlock,
  isValueTypeField,
  isValueTypeItemField,
  notOk,
  ok,
  RichTextBlockType,
  visitFieldsRecursively,
  visitorPathToString,
} from '@datadata/core';
import type { SessionContext } from '.';
import { ensureRequired } from './Assertions';
import * as Db from './Db';
import type { EntitiesTable, EntityVersionsTable } from './DbTableTypes';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters';

export type AdminEntityValues = Pick<EntitiesTable, 'uuid' | 'type' | 'name'> &
  Pick<EntityVersionsTable, 'data' | 'version'>;

export type EntityValues = Pick<EntitiesTable, 'uuid' | 'type' | 'name'> &
  Pick<EntityVersionsTable, 'data'>;

interface EncodeEntityResult {
  type: string;
  name: string;
  data: Record<string, unknown>;
  referenceIds: number[];
  locations: Location[];
}

interface EncodedRichTextBlock {
  t: string;
  d: unknown;
}

export function decodePublishedEntity(context: SessionContext, values: EntityValues): Entity {
  const schema = context.server.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    throw new Error(`No entity spec for type ${values.type}`);
  }
  const entity: Entity = {
    id: values.uuid,
    _type: values.type,
    _name: values.name,
  };
  if (values.data) {
    for (const [fieldName, fieldValue] of Object.entries(values.data)) {
      const fieldSpec = schema.getEntityFieldSpecification(entitySpec, fieldName);
      if (!fieldSpec) {
        throw new Error(`No field spec for ${fieldName} in entity spec ${values.type}`);
      }
      entity[fieldName] = decodeFieldItemOrList(schema, fieldSpec, fieldValue);
    }
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
    return decodeValueItemField(schema, fieldSpec, fieldValue as Value);
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
  const decodedValue: Value = { _type: encodedValue._type };
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
      decodedData = decodeValueItemField(schema, fieldSpec, encodedData as Value);
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
  const entity: AdminEntity = {
    id: values.uuid,
    _type: values.type,
    _name: values.name,
    _version: values.version,
  };
  if (!values.data) {
    entity._deleted = true;
  } else {
    for (const [fieldName, fieldValue] of Object.entries(values.data)) {
      const fieldSpec = schema.getEntityFieldSpecification(entitySpec, fieldName);
      if (!fieldSpec) {
        throw new Error(`No field spec for ${fieldName} in entity spec ${values.type}`);
      }
      entity[fieldName] = decodeFieldItemOrList(schema, fieldSpec, fieldValue);
    }
  }
  return entity;
}

export function resolveCreateEntity(
  context: SessionContext,
  entity: AdminEntityCreate
): Result<AdminEntityCreate, ErrorType.BadRequest> {
  if (!entity._type) {
    return notOk.BadRequest('Missing entity._type');
  }
  if (entity._version && entity._version !== 0) {
    return notOk.BadRequest(`Unsupported version for create: ${entity._version}`);
  }

  const result: AdminEntityCreate = {
    _name: entity._name,
    _type: entity._type,
    _version: 0,
  };

  const schema = context.server.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(result._type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${result._type} doesn’t exist`);
  }

  const unsupportedFieldsResult = checkForUnsupportedFields(entitySpec, entity);
  if (unsupportedFieldsResult.isError()) {
    return unsupportedFieldsResult;
  }

  for (const fieldSpec of entitySpec.fields) {
    if (fieldSpec.name in entity) {
      result[fieldSpec.name] = entity[fieldSpec.name];
    }
  }

  return ok(result);
}

export function resolveUpdateEntity(
  context: SessionContext,
  entity: AdminEntityUpdate,
  type: string,
  previousName: string,
  version: number,
  previousValuesEncoded: Record<string, unknown> | null
): Result<AdminEntity, ErrorType.BadRequest> {
  if (entity._type && entity._type !== type) {
    return notOk.BadRequest(`New type ${entity._type} doesn’t correspond to previous type ${type}`);
  }
  const result: AdminEntity = {
    id: entity.id,
    _name: entity._name || previousName,
    _type: type,
    _version: version,
  };

  const schema = context.server.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(result._type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${result._type} doesn’t exist`);
  }

  const unsupportedFieldsResult = checkForUnsupportedFields(entitySpec, entity);
  if (unsupportedFieldsResult.isError()) {
    return unsupportedFieldsResult;
  }

  for (const fieldSpec of entitySpec.fields) {
    if (fieldSpec.name in entity) {
      result[fieldSpec.name] = entity[fieldSpec.name];
    } else if (previousValuesEncoded && fieldSpec.name in previousValuesEncoded) {
      const encodedData = previousValuesEncoded[fieldSpec.name];
      result[fieldSpec.name] = decodeFieldItemOrList(schema, fieldSpec, encodedData);
    }
  }

  return ok(result);
}

function checkForUnsupportedFields(
  entitySpec: EntityTypeSpecification,
  entity: AdminEntityCreate | AdminEntityUpdate
): Result<void, ErrorType.BadRequest> {
  const unsupportedFieldNames = new Set(Object.keys(entity));

  ['id', '_name', '_type', '_version'].forEach((x) => unsupportedFieldNames.delete(x));
  entitySpec.fields.forEach((x) => unsupportedFieldNames.delete(x.name));

  if (unsupportedFieldNames.size > 0) {
    return notOk.BadRequest(`Unsupported field names: ${[...unsupportedFieldNames].join(', ')}`);
  }
  return ok(undefined);
}

export async function encodeEntity(
  context: SessionContext,
  entity: { _type: string; _name: string; [fieldName: string]: unknown }
): PromiseResult<EncodeEntityResult, ErrorType.BadRequest> {
  const assertion = ensureRequired({ 'entity._type': entity._type, 'entity._name': entity._name });
  if (assertion.isError()) {
    return assertion;
  }

  const { _type: type, _name: name } = entity;

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
  };
  for (const fieldSpec of entitySpec.fields) {
    if (fieldSpec.name in entity) {
      const data = entity[fieldSpec.name];
      if (data === null || data === undefined) {
        continue;
      }
      const prefix = `entity.${fieldSpec.name}`;
      const encodeResult = encodeFieldItemOrList(schema, fieldSpec, prefix, data);
      if (encodeResult.isError()) {
        return encodeResult;
      }
      result.data[fieldSpec.name] = encodeResult.value;
    }
  }

  const collectResult = await collectReferenceIdsAndLocations(context, entity);
  if (collectResult.isError()) {
    return collectResult;
  }
  const { referenceIds, locations } = collectResult.value;
  result.referenceIds.push(...referenceIds);
  result.locations.push(...locations);

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
  data: Value | null
): Result<unknown, ErrorType.BadRequest> {
  if (Array.isArray(data)) {
    return notOk.BadRequest(`${prefix}: expected single value, got list`);
  }
  if (typeof data !== 'object' || !data) {
    return notOk.BadRequest(`${prefix}: expected object, got ${typeof data}`);
  }
  const value = data as { _type: string; [key: string]: unknown };
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

  const encodedValue: Value = { _type: valueType };

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

async function collectReferenceIdsAndLocations(
  context: SessionContext,
  entity: { _type: string; [fieldName: string]: unknown }
): PromiseResult<{ referenceIds: number[]; locations: Location[] }, ErrorType.BadRequest> {
  const allUUIDs = new Set<string>();
  const requestedReferences: {
    prefix: string;
    uuids: string[];
    entityTypes: string[] | undefined;
  }[] = [];

  const locations: Location[] = [];

  visitFieldsRecursively({
    schema: context.server.getSchema(),
    entity,
    visitField: (path, fieldSpec, data, _visitContext) => {
      if (fieldSpec.type !== FieldType.ValueType && fieldSpec.type !== FieldType.RichText) {
        const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
        const uuids = fieldAdapter.getReferenceUUIDs(data);
        if (uuids && uuids.length > 0) {
          uuids.forEach((x) => allUUIDs.add(x));
          requestedReferences.push({
            prefix: visitorPathToString(path),
            uuids,
            entityTypes: fieldSpec.entityTypes,
          });
        }
      }

      if (isLocationItemField(fieldSpec, data) && data) {
        locations.push(data);
      }
    },
    visitRichTextBlock: (path, fieldSpec, block, _visitContext) => {
      if (isRichTextEntityBlock(block) && block.data) {
        allUUIDs.add(block.data.id);
        requestedReferences.push({
          prefix: visitorPathToString(path),
          uuids: [block.data.id],
          entityTypes: fieldSpec.entityTypes,
        });
      }
    },
    initialVisitContext: undefined,
  });

  if (allUUIDs.size === 0) {
    return ok({ referenceIds: [], locations });
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

  return ok({ referenceIds: items.map((item) => item.id), locations });
}
