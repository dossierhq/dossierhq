import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityTypeSpecification,
  AdminEntityUpdate,
  AdminFieldSpecification,
  AdminSchema,
  EntityFieldSpecification,
  EntityReference,
  ErrorType,
  ItemTraverseNode,
  ItemValuePath,
  Location,
  PromiseResult,
  PublishedEntity,
  PublishedEntityTypeSpecification,
  PublishedFieldSpecification,
  PublishedSchema,
  Result,
  RichText,
  RichTextFieldSpecification,
  RichTextValueItemNode,
  ValueItem,
  ValueItemFieldSpecification,
} from '@dossierhq/core';
import {
  AdminEntityStatus,
  assertIsDefined,
  FieldType,
  isEntityItemField,
  isFieldValueEqual,
  isLocationItemField,
  isRichTextEntityLinkNode,
  isRichTextEntityNode,
  isRichTextField,
  isRichTextItemField,
  isRichTextTextNode,
  isRichTextValueItemNode,
  isStringItemField,
  isValueItemField,
  isValueItemItemField,
  ItemTraverseNodeType,
  normalizeEntityFields,
  notOk,
  ok,
  traverseEntity,
  validateTraverseNodeForSave,
  visitorPathToString,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseAdminEntityPayload,
  DatabaseEntityUpdateGetEntityInfoPayload,
  DatabasePublishedEntityPayload,
  DatabaseResolvedEntityReference,
} from '@dossierhq/database-adapter';
import type { SessionContext } from './Context.js';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters.js';
import { transformRichText } from './utils/RichTextTransformer.js';

export interface EncodeAdminEntityResult {
  type: string;
  name: string;
  data: Record<string, unknown>;
  referenceIds: DatabaseResolvedEntityReference[];
  locations: Location[];
  fullTextSearchText: string;
  uniqueIndexValues: Map<string, UniqueIndexValue[]>;
}

export interface UniqueIndexValue {
  path: ItemValuePath;
  value: string;
}

interface RequestedReference {
  prefix: string;
  uuids: string[];
  isRichTextLink: boolean;
  entityTypes: string[] | undefined;
  linkEntityTypes: string[] | undefined;
}

/** `optimized` is the original way of encoding/decoding values, using type adapters and saving less
 * data than the json. Used by entity fields, and value items in entities.
 * For Rich Text, `json` is used, which means values are saved as is. Value items within rich text
 * are encoded as `json`.
 */
export type CodecMode = 'optimized' | 'json';

export function decodePublishedEntity(
  schema: PublishedSchema,
  values: DatabasePublishedEntityPayload
): PublishedEntity {
  const entitySpec = schema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    throw new Error(`No entity spec for type ${values.type}`);
  }
  const entity: PublishedEntity = {
    id: values.id,
    info: {
      type: values.type,
      name: values.name,
      authKey: values.authKey,
      createdAt: values.createdAt,
    },
    fields: {},
  };
  for (const fieldSpec of entitySpec.fields) {
    const { name: fieldName } = fieldSpec;
    const fieldValue = values.fieldValues[fieldName];
    entity.fields[fieldName] = decodeFieldItemOrList(schema, fieldSpec, 'optimized', fieldValue);
  }
  return entity;
}

function decodeFieldItemOrList(
  schema: AdminSchema | PublishedSchema,
  fieldSpec: AdminFieldSpecification | PublishedFieldSpecification,
  codecMode: CodecMode,
  fieldValue: unknown
) {
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
      if (fieldSpec.type === FieldType.ValueItem) {
        const decodedItem = decodeValueItemField(schema, fieldSpec, codecMode, encodedItem);
        decodedItems.push(decodedItem);
      } else if (fieldSpec.type === FieldType.RichText) {
        decodedItems.push(decodeRichTextField(schema, fieldSpec, encodedItem));
      } else {
        decodedItems.push(
          codecMode === 'optimized'
            ? fieldAdapter.decodeData(encodedItem)
            : fieldAdapter.decodeJson(encodedItem)
        );
      }
    }
    return decodedItems;
  }
  if (fieldSpec.type === FieldType.ValueItem) {
    return decodeValueItemField(schema, fieldSpec, codecMode, fieldValue as ValueItem);
  }
  if (fieldSpec.type === FieldType.RichText) {
    return decodeRichTextField(schema, fieldSpec, fieldValue as RichText);
  }
  return codecMode === 'optimized'
    ? fieldAdapter.decodeData(fieldValue)
    : fieldAdapter.decodeJson(fieldValue);
}

function decodeValueItemField(
  schema: AdminSchema | PublishedSchema,
  _fieldSpec: AdminFieldSpecification | PublishedFieldSpecification,
  codecMode: CodecMode,
  encodedValue: ValueItem
) {
  const valueSpec = schema.getValueTypeSpecification(encodedValue.type);
  if (!valueSpec) {
    throw new Error(`Couldn't find spec for value type ${encodedValue.type}`);
  }
  const decodedValue: ValueItem = { type: encodedValue.type };
  for (const fieldFieldSpec of valueSpec.fields) {
    const fieldName = fieldFieldSpec.name;
    const fieldValue = encodedValue[fieldName];
    decodedValue[fieldName] = decodeFieldItemOrList(schema, fieldFieldSpec, codecMode, fieldValue);
  }

  return decodedValue;
}

function decodeRichTextField(
  schema: AdminSchema | PublishedSchema,
  fieldSpec: AdminFieldSpecification | PublishedFieldSpecification,
  encodedValue: RichText
): RichText {
  return transformRichText(encodedValue, (node) => {
    if (isRichTextValueItemNode(node)) {
      const newNode: RichTextValueItemNode = {
        ...node,
        data: decodeValueItemField(schema, fieldSpec, 'json', node.data),
      };
      return newNode;
    }
    return node;
  });
}

export function decodeAdminEntity(
  schema: AdminSchema,
  values: DatabaseAdminEntityPayload
): AdminEntity {
  const entitySpec = schema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    throw new Error(`No entity spec for type ${values.type}`);
  }

  const entity: AdminEntity = {
    id: values.id,
    info: {
      type: values.type,
      name: values.name,
      version: values.version,
      authKey: values.authKey,
      status: values.status,
      valid: values.valid,
      createdAt: values.createdAt,
      updatedAt: values.updatedAt,
    },
    fields: decodeAdminEntityFields(schema, entitySpec, values.fieldValues),
  };

  return entity;
}

export function decodeAdminEntityFields(
  schema: AdminSchema | PublishedSchema,
  entitySpec: AdminEntityTypeSpecification | PublishedEntityTypeSpecification,
  fieldValues: Record<string, unknown>
): AdminEntity['fields'] {
  const fields: AdminEntity['fields'] = {};
  for (const fieldSpec of entitySpec.fields) {
    const { name: fieldName } = fieldSpec;
    const fieldValue = fieldValues[fieldName];
    fields[fieldName] = decodeFieldItemOrList(schema, fieldSpec, 'optimized', fieldValue);
  }
  return fields;
}

export function resolveCreateEntity(
  schema: AdminSchema,
  entity: AdminEntityCreate
): Result<
  { createEntity: AdminEntityCreate; entitySpec: AdminEntityTypeSpecification },
  typeof ErrorType.BadRequest
> {
  const result: AdminEntityCreate = {
    info: {
      name: entity.info.name,
      type: entity.info.type,
      version: 0,
      authKey: entity.info.authKey,
    },
    fields: {},
  };

  const entitySpec = schema.getEntityTypeSpecification(result.info.type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${result.info.type} doesn’t exist`);
  }

  const normalizedResult = normalizeEntityFields(schema, entity);
  if (normalizedResult.isError()) return normalizedResult;
  result.fields = normalizedResult.value;

  return ok({ createEntity: result, entitySpec });
}

export function resolveUpdateEntity(
  schema: AdminSchema,
  entity: AdminEntityUpdate,
  entityInfo: DatabaseEntityUpdateGetEntityInfoPayload
): Result<
  { changed: boolean; entity: AdminEntity; entitySpec: AdminEntityTypeSpecification },
  typeof ErrorType.BadRequest
> {
  const status =
    entityInfo.status === AdminEntityStatus.published
      ? AdminEntityStatus.modified
      : entityInfo.status;

  const result: AdminEntity = {
    id: entity.id,
    info: {
      name: entity.info?.name ?? entityInfo.name,
      type: entityInfo.type,
      version: entityInfo.version + 1,
      authKey: entityInfo.authKey,
      status,
      valid: true,
      createdAt: entityInfo.createdAt,
      updatedAt: entityInfo.updatedAt,
    },
    fields: {},
  };

  const entitySpec = schema.getEntityTypeSpecification(result.info.type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${result.info.type} doesn’t exist`);
  }

  const normalizedResult = normalizeEntityFields(
    schema,
    { ...entity, info: { type: result.info.type } },
    { excludeOmitted: true }
  );
  if (normalizedResult.isError()) return normalizedResult;
  const normalizedFields = normalizedResult.value;

  let changed = false;
  if (result.info.name !== entityInfo.name) {
    changed = true;
  }
  for (const fieldSpec of entitySpec.fields) {
    const fieldName = fieldSpec.name;
    const previousFieldValue = decodeFieldItemOrList(
      schema,
      fieldSpec,
      'optimized',
      entityInfo.fieldValues[fieldName] ?? null
    );

    if (fieldName in normalizedFields) {
      const newFieldValue = normalizedFields[fieldName];
      if (!isFieldValueEqual(previousFieldValue, newFieldValue)) {
        changed = true;
      }
      result.fields[fieldName] = newFieldValue;
    } else {
      result.fields[fieldName] = previousFieldValue;
    }
  }

  if (!changed) {
    result.info.version = entityInfo.version;
    result.info.status = entityInfo.status;
    result.info.valid = entityInfo.valid;
  }

  return ok({ changed, entity: result, entitySpec });
}

export async function encodeAdminEntity(
  schema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entitySpec: AdminEntityTypeSpecification,
  entity: AdminEntity | AdminEntityCreate
): PromiseResult<EncodeAdminEntityResult, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  // Collect values and validate entity fields
  const ftsCollector = createFullTextSearchCollector();
  const referencesCollector = createRequestedReferencesCollector();
  const locationsCollector = createLocationsCollector();
  const uniqueIndexCollector = createUniqueIndexCollector(schema);

  // TODO move all validation to this setup from the encoding
  // TODO consider not encoding data and use it as is
  for (const node of traverseEntity(schema, ['entity'], entity)) {
    const validationIssue = validateTraverseNodeForSave(schema, node);
    if (validationIssue) {
      return notOk.BadRequest(
        `${visitorPathToString(validationIssue.path)}: ${validationIssue.message}`
      );
    }
    ftsCollector.collect(node);
    referencesCollector.collect(node);
    locationsCollector.collect(node);
    uniqueIndexCollector.collect(node);
  }

  const result: EncodeAdminEntityResult = {
    type: entity.info.type,
    name: entity.info.name,
    data: {},
    referenceIds: [],
    locations: locationsCollector.result,
    fullTextSearchText: ftsCollector.result,
    uniqueIndexValues: uniqueIndexCollector.result,
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

  const resolveResult = await resolveRequestedEntityReferences(
    databaseAdapter,
    context,
    referencesCollector.result
  );
  if (resolveResult.isError()) return resolveResult;
  result.referenceIds.push(...resolveResult.value);

  return ok(result);
}

function encodeFieldItemOrList(
  schema: AdminSchema,
  fieldSpec: AdminFieldSpecification,
  prefix: string,
  data: unknown
): Result<unknown, typeof ErrorType.BadRequest> {
  const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
  if (fieldSpec.list) {
    if (!Array.isArray(data)) {
      return notOk.BadRequest(`${prefix}: expected list`);
    }
    const encodedItems: unknown[] = [];
    for (const decodedItem of data) {
      let encodedItemResult;
      if (isValueItemItemField(fieldSpec, decodedItem)) {
        encodedItemResult = encodeValueItemField(
          schema,
          fieldSpec as AdminFieldSpecification<ValueItemFieldSpecification>,
          prefix,
          decodedItem
        );
      } else if (isRichTextItemField(fieldSpec, decodedItem)) {
        encodedItemResult = encodeRichTextField(decodedItem);
      } else {
        encodedItemResult = fieldAdapter.encodeData(fieldSpec, prefix, decodedItem);
      }
      if (encodedItemResult.isError()) {
        return encodedItemResult;
      }
      encodedItems.push(encodedItemResult.value);
    }
    return ok(encodedItems);
  }

  if (isValueItemField(fieldSpec, data)) {
    return encodeValueItemField(
      schema,
      fieldSpec as AdminFieldSpecification<ValueItemFieldSpecification>,
      prefix,
      data
    );
  } else if (isRichTextField(fieldSpec, data)) {
    return encodeRichTextField(data);
  }
  return fieldAdapter.encodeData(fieldSpec, prefix, data);
}

function encodeValueItemField(
  schema: AdminSchema,
  fieldSpec: AdminFieldSpecification<ValueItemFieldSpecification>,
  prefix: string,
  data: ValueItem | null
): Result<unknown, typeof ErrorType.BadRequest> {
  if (Array.isArray(data)) {
    return notOk.BadRequest(`${prefix}: expected single value, got list`);
  }
  if (typeof data !== 'object' || !data) {
    return notOk.BadRequest(`${prefix}: expected object, got ${typeof data}`);
  }
  const value = data as ValueItem;
  const valueType = value.type;
  if (!valueType) {
    return notOk.BadRequest(`${prefix}: missing type`);
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
  unsupportedFields.delete('type');
  valueSpec.fields.forEach((x) => unsupportedFields.delete(x.name));
  if (unsupportedFields.size > 0) {
    return notOk.BadRequest(
      `${prefix}: Unsupported field names: ${[...unsupportedFields].join(', ')}`
    );
  }

  const encodedValue: ValueItem = { type: valueType };

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
  data: RichText | null
): Result<RichText | null, typeof ErrorType.BadRequest> {
  return ok(data);
}

export function createFullTextSearchCollector<TSchema extends AdminSchema | PublishedSchema>() {
  const fullTextSearchText: string[] = [];
  return {
    collect: (node: ItemTraverseNode<TSchema>) => {
      switch (node.type) {
        case ItemTraverseNodeType.fieldItem:
          if (isStringItemField(node.fieldSpec, node.value) && node.value) {
            fullTextSearchText.push(node.value);
          }
          break;
        case ItemTraverseNodeType.richTextNode: {
          const richTextNode = node.node;
          if (isRichTextTextNode(richTextNode) && richTextNode.text) {
            fullTextSearchText.push(richTextNode.text);
          }
          break;
        }
      }
    },
    get result() {
      return fullTextSearchText.join(' ');
    },
  };
}

//TODO we have three similar implementations of this function, should it move to core?
export function createReferencesCollector<TSchema extends AdminSchema | PublishedSchema>() {
  const references = new Set<string>();
  return {
    collect: (node: ItemTraverseNode<TSchema>) => {
      switch (node.type) {
        case ItemTraverseNodeType.fieldItem:
          if (isEntityItemField(node.fieldSpec, node.value) && node.value) {
            references.add(node.value.id);
          }
          break;
        case ItemTraverseNodeType.richTextNode: {
          const richTextNode = node.node;
          if (isRichTextEntityNode(richTextNode) || isRichTextEntityLinkNode(richTextNode)) {
            references.add(richTextNode.reference.id);
          }
          break;
        }
      }
    },
    get result(): EntityReference[] {
      return [...references].map((id) => ({ id }));
    },
  };
}

export function createRequestedReferencesCollector<
  TSchema extends AdminSchema | PublishedSchema
>() {
  const requestedReferences: RequestedReference[] = [];
  return {
    collect: (node: ItemTraverseNode<TSchema>) => {
      switch (node.type) {
        case ItemTraverseNodeType.fieldItem:
          if (isEntityItemField(node.fieldSpec, node.value) && node.value) {
            const entityItemFieldSpec = node.fieldSpec as EntityFieldSpecification;
            requestedReferences.push({
              prefix: visitorPathToString(node.path),
              uuids: [node.value.id], //TODO handle list field (optimization, one requested reference instead of one for each item in the list)
              entityTypes: entityItemFieldSpec.entityTypes,
              linkEntityTypes: undefined,
              isRichTextLink: false,
            });
          }
          break;
        case ItemTraverseNodeType.richTextNode: {
          const richTextNode = node.node;
          if (isRichTextEntityNode(richTextNode) || isRichTextEntityLinkNode(richTextNode)) {
            const richTextFieldSpecification = node.fieldSpec as RichTextFieldSpecification;
            requestedReferences.push({
              prefix: visitorPathToString(node.path),
              uuids: [richTextNode.reference.id],
              entityTypes: richTextFieldSpecification.entityTypes,
              linkEntityTypes: richTextFieldSpecification.linkEntityTypes,
              isRichTextLink: isRichTextEntityLinkNode(richTextNode),
            });
          }
          break;
        }
      }
    },
    get result(): RequestedReference[] {
      return requestedReferences;
    },
  };
}

export function createUniqueIndexCollector<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema
) {
  const uniqueIndexValues = new Map<string, UniqueIndexValue[]>();
  return {
    collect: (node: ItemTraverseNode<TSchema>) => {
      switch (node.type) {
        case ItemTraverseNodeType.fieldItem: {
          const indexName = 'index' in node.fieldSpec ? node.fieldSpec.index : undefined;
          if (indexName && isStringItemField(node.fieldSpec, node.value) && node.value) {
            const indexValues = uniqueIndexValues.get(indexName);
            if (indexValues) {
              //TODO fail on duplicates?
              if (!indexValues.find((it) => it.value === node.value)) {
                indexValues.push({ path: node.path, value: node.value });
              }
            } else {
              const index = schema.getIndex(indexName);
              assertIsDefined(index);
              if (index.type === 'unique') {
                uniqueIndexValues.set(indexName, [{ path: node.path, value: node.value }]);
              }
            }
          }
          break;
        }
      }
    },
    get result(): Map<string, UniqueIndexValue[]> {
      return uniqueIndexValues;
    },
  };
}

export function createLocationsCollector<TSchema extends AdminSchema | PublishedSchema>() {
  const locations: Location[] = [];
  return {
    collect: (node: ItemTraverseNode<TSchema>) => {
      switch (node.type) {
        case ItemTraverseNodeType.fieldItem:
          if (isLocationItemField(node.fieldSpec, node.value) && node.value) {
            locations.push(node.value);
          }
      }
    },
    get result(): Location[] {
      return locations;
    },
  };
}

async function resolveRequestedEntityReferences(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  requestedReferences: RequestedReference[]
): PromiseResult<
  DatabaseResolvedEntityReference[],
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const allUUIDs = new Set<string>();
  requestedReferences.forEach(({ uuids }) => uuids.forEach((uuid) => allUUIDs.add(uuid)));

  if (allUUIDs.size === 0) {
    return ok([]);
  }

  const result = await databaseAdapter.adminEntityGetReferenceEntitiesInfo(
    context,
    [...allUUIDs].map((id) => ({ id }))
  );
  if (result.isError()) {
    return result;
  }

  const items = result.value;

  for (const request of requestedReferences) {
    for (const uuid of request.uuids) {
      const item = items.find((it) => it.id === uuid);
      if (!item) {
        return notOk.BadRequest(`${request.prefix}: Referenced entity (${uuid}) doesn’t exist`);
      }
      if (request.isRichTextLink && request.linkEntityTypes && request.linkEntityTypes.length > 0) {
        if (request.linkEntityTypes.indexOf(item.type) < 0) {
          return notOk.BadRequest(
            `${request.prefix}: Linked entity (${uuid}) has an invalid type ${item.type}`
          );
        }
      } else if (request.entityTypes && request.entityTypes.length > 0) {
        if (request.entityTypes.indexOf(item.type) < 0) {
          return notOk.BadRequest(
            `${request.prefix}: Referenced entity (${uuid}) has an invalid type ${item.type}`
          );
        }
      }
    }
  }

  return ok(items.map(({ entityInternalId }) => ({ entityInternalId })));
}
