import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  Entity,
  EntityReference,
  FieldSpecification,
  FieldValueTypeMap,
  RichText,
  RichTextBlock,
  Schema,
  ValueItem,
} from '.';
import { assertExhaustive, assertIsDefined, FieldType, RichTextBlockType } from '.';

/** Check if `value` with `fieldSpec` is a single boolean field */
export function isBooleanField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[FieldType.Boolean] | null {
  return fieldSpec.type === FieldType.Boolean && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list boolean field */
export function isBooleanListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[FieldType.Boolean]> | null {
  return fieldSpec.type === FieldType.Boolean && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single boolean field or an item in a list field */
export function isBooleanItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[FieldType.Boolean] | null {
  return fieldSpec.type === FieldType.Boolean;
}

/** Check if `value` with `fieldSpec` is a single EntityType field */
export function isEntityTypeField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[FieldType.EntityType] | null {
  return fieldSpec.type === FieldType.EntityType && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list EntityType field */
export function isEntityTypeListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[FieldType.EntityType]> | null {
  return fieldSpec.type === FieldType.EntityType && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single EntityType field or an item in a list field */
export function isEntityTypeItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[FieldType.EntityType] | null {
  return fieldSpec.type === FieldType.EntityType;
}

/** Check if `value` with `fieldSpec` is a single Location field */
export function isLocationField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[FieldType.Location] | null {
  return fieldSpec.type === FieldType.Location && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list Location field */
export function isLocationListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[FieldType.Location]> | null {
  return fieldSpec.type === FieldType.Location && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single Location field or an item in a list field */
export function isLocationItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[FieldType.Location] | null {
  return fieldSpec.type === FieldType.Location;
}

/** Check if `value` with `fieldSpec` is a single String field */
export function isStringField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[FieldType.String] | null {
  return fieldSpec.type === FieldType.String && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list String field */
export function isStringListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[FieldType.String]> | null {
  return fieldSpec.type === FieldType.String && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single String field or an item in a list field */
export function isStringItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[FieldType.String] | null {
  return fieldSpec.type === FieldType.String;
}

/** Check if `value` with `fieldSpec` is a single RichText field */
export function isRichTextField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[FieldType.RichText] | null {
  return fieldSpec.type === FieldType.RichText && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list RichText field */
export function isRichTextListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[FieldType.RichText]> | null {
  return fieldSpec.type === FieldType.RichText && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single RichText field or an item in a list field */
export function isRichTextItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[FieldType.RichText] | null {
  return fieldSpec.type === FieldType.RichText;
}

/** Check if `value` with `fieldSpec` is a single ValueType field */
export function isValueTypeField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[FieldType.ValueType] | null {
  return fieldSpec.type === FieldType.ValueType && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list ValueType field */
export function isValueTypeListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[FieldType.ValueType]> | null {
  return fieldSpec.type === FieldType.ValueType && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single ValueType field or an item in a list field */
export function isValueTypeItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[FieldType.ValueType] | null {
  return fieldSpec.type === FieldType.ValueType;
}

export function isRichTextEntityBlock(
  block: RichTextBlock
): block is RichTextBlock<RichTextBlockType.entity, EntityReference | null> {
  return block.type === RichTextBlockType.entity;
}

export function isRichTextParagraphBlock(
  block: RichTextBlock
): block is RichTextBlock<RichTextBlockType.paragraph, { text: string }> {
  return block.type === RichTextBlockType.paragraph;
}

export function isRichTextValueItemBlock(
  block: RichTextBlock
): block is RichTextBlock<RichTextBlockType.valueItem, ValueItem | null> {
  return block.type === RichTextBlockType.valueItem;
}

export function isItemValueItem(
  item: ValueItem | Entity | AdminEntity | AdminEntityCreate | AdminEntityUpdate
): item is ValueItem {
  return 'type' in item;
}

export function isItemAdminEntity(item: ValueItem | Entity | AdminEntity): item is AdminEntity {
  return !isItemValueItem(item) && 'version' in item.info;
}

export function isItemEntity(item: ValueItem | Entity | AdminEntity): item is Entity {
  return !isItemValueItem(item) && !isItemAdminEntity(item);
}

export function visitorPathToString(path: (string | number)[]): string {
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
type VisitorVisitRichTextBlock<TVisitContext> = (
  path: Array<string | number>,
  fieldSpec: FieldSpecification,
  block: RichTextBlock,
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
  visitRichTextBlock: VisitorVisitRichTextBlock<TVisitContext>;
  enterValueItem: VisitorEnterValueItem<TVisitContext> | undefined;
  enterList: VisitorEnterList<TVisitContext> | undefined;
  enterRichText: VisitorEnterRichText<TVisitContext> | undefined;
}

export function visitItemRecursively<TVisitContext>({
  schema,
  item,
  path,
  visitField,
  visitRichTextBlock,
  enterValueItem = undefined,
  enterList = undefined,
  enterRichText = undefined,
  initialVisitContext,
}: {
  schema: Schema;
  item: Entity | AdminEntity | ValueItem;
  path?: (number | string)[];
  visitField: VisitorVisitField<TVisitContext>;
  visitRichTextBlock: VisitorVisitRichTextBlock<TVisitContext>;
  enterValueItem?: VisitorEnterValueItem<TVisitContext>;
  enterList?: VisitorEnterList<TVisitContext>;
  enterRichText?: VisitorEnterRichText<TVisitContext>;
  initialVisitContext: TVisitContext;
}): void {
  doVisitItemRecursively(
    schema,
    path ?? [],
    item,
    { visitField, visitRichTextBlock, enterValueItem, enterList, enterRichText },
    initialVisitContext
  );
}

export function visitFieldRecursively<TVisitContext>({
  schema,
  path = [],
  fieldSpec,
  value,
  visitField,
  visitRichTextBlock,
  enterValueItem = undefined,
  enterList = undefined,
  enterRichText = undefined,
  visitContext,
}: {
  schema: Schema;
  path?: (string | number)[];
  fieldSpec: FieldSpecification;
  value: unknown;
  visitField: VisitorVisitField<TVisitContext>;
  visitRichTextBlock: VisitorVisitRichTextBlock<TVisitContext>;
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
    { visitField, visitRichTextBlock, enterValueItem, enterList, enterRichText },
    visitContext
  );
}

function doVisitItemRecursively<TVisitContext>(
  schema: Schema,
  path: (string | number)[],
  item: ValueItem | AdminEntity | Entity,
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
  schema: Schema,
  path: (string | number)[],
  fieldSpec: FieldSpecification,
  value: unknown,
  callbacks: VisitorCallbacks<TVisitContext>,
  visitContext: TVisitContext
) {
  const { enterRichText, enterValueItem, visitField, visitRichTextBlock } = callbacks;
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
    for (let i = 0; i < value.blocks.length; i += 1) {
      const blockPath = [...path, i];
      const block = value.blocks[i];
      visitRichTextBlock(blockPath, fieldSpec, block, richTextVisitContext);
      if (block.type === RichTextBlockType.valueItem && block.data) {
        doVisitItemRecursively(
          schema,
          blockPath,
          block.data as ValueItem,
          callbacks,
          enterValueItem
            ? enterValueItem(path, fieldSpec, block.data as ValueItem, richTextVisitContext)
            : richTextVisitContext
        );
      }
    }
  }
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
  schema: Schema,
  fieldSpec: FieldSpecification,
  value: unknown
): unknown {
  if (fieldSpec.list) {
    if (!value) return null;
    if (!Array.isArray(value)) throw new Error(`Expected array, got ${typeof value}: ${value}`);

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

function normalizeFieldValueItem(schema: Schema, fieldSpec: FieldSpecification, value: unknown) {
  if (value === null) return null;
  const type = fieldSpec.type as FieldType;
  switch (type) {
    case FieldType.Boolean:
    case FieldType.EntityType:
    case FieldType.Location:
    case FieldType.RichText: // TODO normalize rich text value
      return value;
    case FieldType.String:
      //TODO support trimming of strings?
      return value ? value : null;
    case FieldType.ValueType: {
      const valueItem = value as ValueItem;
      const newValueItem: ValueItem = { type: valueItem.type };
      let changed = false;

      const valueSpec = schema.getValueTypeSpecification(valueItem.type);
      assertIsDefined(valueSpec);
      for (const [fieldName, fieldValue] of Object.entries(valueItem)) {
        if (fieldName === 'type') continue;

        const fieldFieldSpec = schema.getValueFieldSpecification(valueSpec, fieldName);
        assertIsDefined(fieldFieldSpec);
        const normalizedFieldValue = normalizeFieldValue(schema, fieldFieldSpec, fieldValue);
        newValueItem[fieldName] = normalizedFieldValue;
        if (normalizedFieldValue !== fieldValue) {
          changed = true;
        }
      }

      return changed ? newValueItem : valueItem;
    }
    default:
      assertExhaustive(type);
  }
}
