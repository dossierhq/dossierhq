import { assertExhaustive } from './Asserts.js';
import type {
  AdminSchema,
  FieldSpecification,
  FieldValueTypeMap,
  PublishedSchema,
} from './Schema.js';
import { FieldType, RichTextNodeType } from './Schema.js';
import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  EntityLike,
  PublishedEntity,
  RichText,
  RichTextElementNode,
  RichTextEntityNode,
  RichTextNode,
  RichTextTextNode,
  RichTextValueItemNode,
  ValueItem,
} from './Types.js';

/** Check if `value` with `fieldSpec` is a single boolean field */
export function isBooleanField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Boolean] | null {
  return fieldSpec.type === FieldType.Boolean && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list boolean field */
export function isBooleanListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.Boolean]> | null {
  return fieldSpec.type === FieldType.Boolean && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single boolean field or an item in a list field */
export function isBooleanItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Boolean] | null {
  return fieldSpec.type === FieldType.Boolean;
}

/** Check if `value` with `fieldSpec` is a single EntityType field */
export function isEntityTypeField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.EntityType] | null {
  return fieldSpec.type === FieldType.EntityType && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list EntityType field */
export function isEntityTypeListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.EntityType]> | null {
  return fieldSpec.type === FieldType.EntityType && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single EntityType field or an item in a list field */
export function isEntityTypeItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.EntityType] | null {
  return fieldSpec.type === FieldType.EntityType;
}

/** Check if `value` with `fieldSpec` is a single Location field */
export function isLocationField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Location] | null {
  return fieldSpec.type === FieldType.Location && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list Location field */
export function isLocationListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.Location]> | null {
  return fieldSpec.type === FieldType.Location && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single Location field or an item in a list field */
export function isLocationItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Location] | null {
  return fieldSpec.type === FieldType.Location;
}

/** Check if `value` with `fieldSpec` is a single String field */
export function isStringField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.String] | null {
  return fieldSpec.type === FieldType.String && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list String field */
export function isStringListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.String]> | null {
  return fieldSpec.type === FieldType.String && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single String field or an item in a list field */
export function isStringItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.String] | null {
  return fieldSpec.type === FieldType.String;
}

/** Check if `value` with `fieldSpec` is a single RichText field */
export function isRichTextField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.RichText] | null {
  return fieldSpec.type === FieldType.RichText && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list RichText field */
export function isRichTextListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.RichText]> | null {
  return fieldSpec.type === FieldType.RichText && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single RichText field or an item in a list field */
export function isRichTextItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.RichText] | null {
  return fieldSpec.type === FieldType.RichText;
}

/** Check if `value` with `fieldSpec` is a single ValueType field */
export function isValueTypeField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.ValueType] | null {
  return fieldSpec.type === FieldType.ValueType && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list ValueType field */
export function isValueTypeListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.ValueType]> | null {
  return fieldSpec.type === FieldType.ValueType && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single ValueType field or an item in a list field */
export function isValueTypeItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.ValueType] | null {
  return fieldSpec.type === FieldType.ValueType;
}

export function isRichTextTextNode(node: RichTextNode): node is RichTextTextNode {
  return node.type === RichTextNodeType.text;
}

export function isRichTextElementNode(node: RichTextNode): node is RichTextElementNode {
  return 'children' in node;
}

export function isRichTextEntityNode(node: RichTextNode): node is RichTextEntityNode {
  return node.type === RichTextNodeType.entity;
}

export function isRichTextValueItemNode(node: RichTextNode): node is RichTextValueItemNode {
  return node.type === RichTextNodeType.valueItem;
}

export function isItemValueItem(
  item:
    | ValueItem
    | PublishedEntity
    | AdminEntity
    | AdminEntityCreate
    | AdminEntityUpdate
    | EntityLike
): item is ValueItem {
  return 'type' in item;
}

export function isItemAdminEntity(
  item: ValueItem | PublishedEntity | AdminEntity
): item is AdminEntity {
  return !isItemValueItem(item) && 'version' in item.info;
}

export function isItemEntity(
  item: ValueItem | PublishedEntity | AdminEntity
): item is PublishedEntity {
  return !isItemValueItem(item) && !isItemAdminEntity(item);
}

export type ItemValuePath = (string | number)[];

export function isItemValuePathEqual(a: ItemValuePath, b: ItemValuePath): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function visitorPathToString(path: ItemValuePath): string {
  let result = '';
  for (const segment of path) {
    if (Number.isInteger(segment)) {
      result += `[${segment}]`;
    } else {
      if (result.length === 0) {
        result += segment;
      } else {
        result += `.${segment}`;
      }
    }
  }
  return result;
}

type VisitorVisitField<TVisitContext> = (
  path: Array<string | number>,
  fieldSpec: FieldSpecification,
  data: unknown,
  visitContext: TVisitContext
) => void;
type VisitorVisitRichTextNode<TVisitContext> = (
  path: Array<string | number>,
  fieldSpec: FieldSpecification,
  node: RichTextNode,
  visitContext: TVisitContext
) => void;
type VisitorEnterValueItem<TVisitContext> = (
  path: Array<string | number>,
  fieldSpec: FieldSpecification,
  valueItem: ValueItem,
  visitContext: TVisitContext
) => TVisitContext;
type VisitorEnterList<TVisitContext> = (
  path: Array<string | number>,
  fieldSpec: FieldSpecification,
  list: unknown[],
  visitContext: TVisitContext
) => TVisitContext;
type VisitorEnterRichText<TVisitContext> = (
  path: Array<string | number>,
  fieldSpec: FieldSpecification,
  RichText: RichText,
  visitContext: TVisitContext
) => TVisitContext;

interface VisitorCallbacks<TVisitContext> {
  visitField: VisitorVisitField<TVisitContext>;
  visitRichTextNode: VisitorVisitRichTextNode<TVisitContext>;
  enterValueItem: VisitorEnterValueItem<TVisitContext> | undefined;
  enterList: VisitorEnterList<TVisitContext> | undefined;
  enterRichText: VisitorEnterRichText<TVisitContext> | undefined;
}

export function visitItemRecursively<TVisitContext>({
  schema,
  item,
  path,
  visitField,
  visitRichTextNode,
  enterValueItem = undefined,
  enterList = undefined,
  enterRichText = undefined,
  initialVisitContext,
}: {
  schema: AdminSchema | PublishedSchema;
  item: EntityLike | ValueItem;
  path?: ItemValuePath;
  visitField: VisitorVisitField<TVisitContext>;
  visitRichTextNode: VisitorVisitRichTextNode<TVisitContext>;
  enterValueItem?: VisitorEnterValueItem<TVisitContext>;
  enterList?: VisitorEnterList<TVisitContext>;
  enterRichText?: VisitorEnterRichText<TVisitContext>;
  initialVisitContext: TVisitContext;
}): void {
  doVisitItemRecursively(
    schema,
    path ?? [],
    item,
    { visitField, visitRichTextNode, enterValueItem, enterList, enterRichText },
    initialVisitContext
  );
}

export function visitFieldRecursively<TVisitContext>({
  schema,
  path = [],
  fieldSpec,
  value,
  visitField,
  visitRichTextNode,
  enterValueItem = undefined,
  enterList = undefined,
  enterRichText = undefined,
  visitContext,
}: {
  schema: AdminSchema | PublishedSchema;
  path?: ItemValuePath;
  fieldSpec: FieldSpecification;
  value: unknown;
  visitField: VisitorVisitField<TVisitContext>;
  visitRichTextNode: VisitorVisitRichTextNode<TVisitContext>;
  enterValueItem?: VisitorEnterValueItem<TVisitContext>;
  enterList?: VisitorEnterList<TVisitContext>;
  enterRichText?: VisitorEnterRichText<TVisitContext>;
  visitContext: TVisitContext;
}): void {
  doVisitFieldRecursively(
    schema,
    path,
    fieldSpec,
    value,
    { visitField, visitRichTextNode, enterValueItem, enterList, enterRichText },
    visitContext
  );
}

function doVisitItemRecursively<TVisitContext>(
  schema: AdminSchema | PublishedSchema,
  path: ItemValuePath,
  item: ValueItem | EntityLike,
  callbacks: VisitorCallbacks<TVisitContext>,
  visitContext: TVisitContext
) {
  const { enterList } = callbacks;
  let fieldSpecs;
  let fields;
  if (!isItemValueItem(item)) {
    fields = item.fields;
    path = [...path, 'fields'];

    const entitySpec = schema.getEntityTypeSpecification(item.info.type);
    if (!entitySpec) {
      throw new Error(`Couldn't find spec for entity type ${item.info.type}`);
    }
    fieldSpecs = entitySpec.fields;
  } else {
    fields = item;

    const valueSpec = schema.getValueTypeSpecification(item.type);
    if (!valueSpec) {
      throw new Error(
        `${visitorPathToString(path)}: Couldn't find spec for value type ${item.type}`
      );
    }
    fieldSpecs = valueSpec.fields;
  }

  for (const fieldSpec of fieldSpecs) {
    const fieldValue = fields?.[fieldSpec.name];
    if (fieldValue === null || fieldValue === undefined) {
      continue;
    }
    const fieldPath = [...path, fieldSpec.name];
    if (fieldSpec.list) {
      if (!Array.isArray(fieldValue)) {
        throw new Error(
          `${visitorPathToString(fieldPath)}: expected list got ${typeof fieldValue}`
        );
      }
      const listVisitContext = enterList
        ? enterList(fieldPath, fieldSpec, fieldValue, visitContext)
        : visitContext;
      for (let i = 0; i < fieldValue.length; i += 1) {
        const fieldItemPath = [...fieldPath, i];
        const fieldItem = fieldValue[i];

        doVisitFieldRecursively(
          schema,
          fieldItemPath,
          fieldSpec,
          fieldItem,
          callbacks,
          listVisitContext
        );
      }
    } else {
      doVisitFieldRecursively(schema, fieldPath, fieldSpec, fieldValue, callbacks, visitContext);
    }
  }
}

function doVisitFieldRecursively<TVisitContext>(
  schema: AdminSchema | PublishedSchema,
  path: ItemValuePath,
  fieldSpec: FieldSpecification,
  value: unknown,
  callbacks: VisitorCallbacks<TVisitContext>,
  visitContext: TVisitContext
) {
  const { enterRichText, enterValueItem, visitField } = callbacks;
  visitField(path, fieldSpec, value, visitContext);

  if (isValueTypeItemField(fieldSpec, value) && value) {
    doVisitItemRecursively(
      schema,
      path,
      value,
      callbacks,
      enterValueItem ? enterValueItem(path, fieldSpec, value, visitContext) : visitContext
    );
  } else if (isRichTextItemField(fieldSpec, value) && value) {
    const richTextVisitContext = enterRichText
      ? enterRichText(path, fieldSpec, value, visitContext)
      : visitContext;

    visitRichTextNodeRecursively(
      schema,
      fieldSpec,
      path,
      value.root,
      callbacks,
      richTextVisitContext
    );
  }
}

function visitRichTextNodeRecursively<TVisitContext>(
  schema: AdminSchema | PublishedSchema,
  fieldSpec: FieldSpecification,
  path: ItemValuePath,
  node: RichTextNode,
  callbacks: VisitorCallbacks<TVisitContext>,
  visitContext: TVisitContext
) {
  const { visitRichTextNode } = callbacks;
  visitRichTextNode(path, fieldSpec, node, visitContext);

  if (isRichTextValueItemNode(node) && node.data) {
    doVisitItemRecursively(schema, path, node.data as ValueItem, callbacks, visitContext);
  }

  if (isRichTextElementNode(node)) {
    for (let i = 0; i < node.children.length; i += 1) {
      const childPath = [...path, i];
      const childNode = node.children[i];
      visitRichTextNodeRecursively(
        schema,
        fieldSpec,
        childPath,
        childNode,
        callbacks,
        visitContext
      );
    }
  }
}

export function copyEntity<
  T extends AdminEntity<string, object> | AdminEntityCreate | PublishedEntity
>(
  entity: T,
  changes: { id?: string; info?: Partial<T['info']>; fields?: Partial<T['fields']> }
): T {
  const copy = { ...entity };
  if (typeof changes.id === 'string') {
    copy.id = changes.id;
  }
  if (changes.info) {
    copy.info = { ...entity.info };
    for (const [key, value] of Object.entries(changes.info)) {
      (copy.info as unknown as Record<string, unknown>)[key] = value;
    }
  }
  if (changes.fields) {
    const fieldsCopy = { ...entity.fields };
    copy.fields = fieldsCopy;
    for (const [key, value] of Object.entries(changes.fields)) {
      fieldsCopy[key] = value;
    }
  }
  return copy;
}

export function isEntityNameAsRequested(currentName: string, requestedName: string): boolean {
  if (requestedName === currentName) {
    return true;
  }
  const hashIndex = currentName.lastIndexOf('#');
  if (hashIndex < 0) {
    return false;
  }
  const currentWithoutUniqueNumber = currentName.slice(0, hashIndex);
  return requestedName === currentWithoutUniqueNumber;
}

export function isFieldValueEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || a === undefined || b === null || b === undefined) {
    return false; // if a or be are not defined they can't be equal
  }

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!isFieldValueEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  if (typeof a === 'object') {
    if (typeof b !== 'object' || a === null || b === null) return false;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (
        !isFieldValueEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
      ) {
        return false;
      }
    }
    return true;
  }

  return false;
}

export function normalizeFieldValue(
  schema: AdminSchema,
  fieldSpec: FieldSpecification,
  value: unknown
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (fieldSpec.list) {
    if (!Array.isArray(value)) {
      return value; // Invalid
    }

    let changed = false;
    const newList = [];
    for (let i = 0; i < value.length; i += 1) {
      const item = value[i];
      const normalizedItem = normalizeFieldValueItem(schema, fieldSpec, item);
      if (item !== normalizedItem || normalizedItem === null) {
        changed = true;
      }
      if (normalizedItem !== null) {
        newList.push(normalizedItem);
      }
    }

    if (newList.length === 0) {
      return null;
    }
    return changed ? newList : value;
  }

  return normalizeFieldValueItem(schema, fieldSpec, value);
}

function normalizeFieldValueItem(
  schema: AdminSchema,
  fieldSpec: FieldSpecification,
  value: unknown
) {
  if (value === null) return value;

  const type = fieldSpec.type as FieldType;
  switch (type) {
    case FieldType.Boolean:
    case FieldType.EntityType:
    case FieldType.Location:
      return value;
    case FieldType.RichText: {
      // TODO normalize rich text more?
      // Don't fail on invalid rich text, just ignore it in this phase
      const richText = value as RichText;
      if (
        typeof richText === 'object' &&
        typeof richText.root === 'object' &&
        Array.isArray(richText.root.children) &&
        richText.root.children.length === 1
      ) {
        const onlyChild = richText.root.children[0];
        if (
          onlyChild.type === RichTextNodeType.paragraph &&
          isRichTextElementNode(onlyChild) &&
          onlyChild.children.length === 0
        ) {
          return null;
        }
      }
      return value;
    }
    case FieldType.String:
      //TODO support trimming of strings?
      return value ? value : null;
    case FieldType.ValueType: {
      const valueItem = value as ValueItem;
      const newValueItem: ValueItem = { type: valueItem.type };
      let changed = false;

      const valueSpec = schema.getValueTypeSpecification(valueItem.type);
      if (!valueSpec) {
        return value; // Invalid
      }
      for (const fieldFieldSpec of valueSpec.fields) {
        const fieldName = fieldFieldSpec.name;
        const fieldValue = valueItem[fieldName];
        const normalizedFieldValue =
          normalizeFieldValue(schema, fieldFieldSpec, fieldValue) ?? null;
        newValueItem[fieldName] = normalizedFieldValue;
        if (normalizedFieldValue !== fieldValue) {
          changed = true;
        }
      }

      for (const [fieldName, fieldValue] of Object.entries(valueItem)) {
        if (!(fieldName in newValueItem)) {
          // Invalid, so just reuse initial value
          newValueItem[fieldName] = fieldValue;
        }
      }

      return changed ? newValueItem : valueItem;
    }
    default: {
      assertExhaustive(type);
    }
  }
}
