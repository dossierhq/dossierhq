import type { FieldSpecification, FieldValueTypeMap, RichTextBlock, Schema, Value } from '.';
import { FieldType, RichTextBlockType } from '.';

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

export function visitorPathToString(path: Array<string | number>): string {
  let result = 'entity';
  for (const segment of path) {
    if (Number.isInteger(segment)) {
      result += `[${segment}]`;
    } else {
      result += `.${segment}`;
    }
  }
  return result;
}

export function visitFieldsRecursively<TVisitContext>({
  schema,
  entity,
  visitField,
  visitRichTextBlock,
  enterValueItem = undefined,
  enterList = undefined,
  initialVisitContext,
}: {
  schema: Schema;
  entity: { _type: string; [fieldName: string]: unknown };
  visitField: (
    path: Array<string | number>,
    fieldSpec: FieldSpecification,
    data: unknown,
    visitContext: TVisitContext
  ) => void;
  visitRichTextBlock: (
    path: Array<string | number>,
    fieldSpec: FieldSpecification,
    block: RichTextBlock,
    visitContext: TVisitContext
  ) => void;
  enterValueItem?: (
    path: Array<string | number>,
    fieldSpec: FieldSpecification,
    valueItem: Value,
    visitContext: TVisitContext
  ) => TVisitContext;
  enterList?: (
    path: Array<string | number>,
    fieldSpec: FieldSpecification,
    list: unknown[],
    visitContext: TVisitContext
  ) => TVisitContext;
  initialVisitContext: TVisitContext;
}): void {
  function doVisitItem(
    path: Array<string | number>,
    item: { _type: string; [fieldName: string]: unknown },
    isEntity: boolean,
    visitContext: TVisitContext
  ) {
    let fieldSpecs;
    if (isEntity) {
      const entitySpec = schema.getEntityTypeSpecification(item._type);
      if (!entitySpec) {
        throw new Error(`Couldn't find spec for entity type ${item._type}`);
      }
      fieldSpecs = entitySpec.fields;
    } else {
      const valueSpec = schema.getValueTypeSpecification(item._type);
      if (!valueSpec) {
        throw new Error(
          `${visitorPathToString(path)}: Couldn't find spec for value type ${item._type}`
        );
      }
      fieldSpecs = valueSpec.fields;
    }

    for (const fieldSpec of fieldSpecs) {
      const fieldValue = item[fieldSpec.name];
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

          doVisitItemField(fieldItemPath, fieldSpec, fieldItem, listVisitContext);
        }
      } else {
        doVisitItemField(fieldPath, fieldSpec, fieldValue, visitContext);
      }
    }
  }

  function doVisitItemField(
    path: (string | number)[],
    fieldSpec: FieldSpecification,
    value: unknown,
    visitContext: TVisitContext
  ) {
    visitField(path, fieldSpec, value, visitContext);

    if (isValueTypeItemField(fieldSpec, value) && value) {
      doVisitItem(
        path,
        value,
        false,
        enterValueItem ? enterValueItem(path, fieldSpec, value, visitContext) : visitContext
      );
    } else if (isRichTextItemField(fieldSpec, value) && value) {
      for (let i = 0; i < value.blocks.length; i += 1) {
        const blockPath = [...path, i];
        const block = value.blocks[i];
        visitRichTextBlock(blockPath, fieldSpec, block, visitContext);
        if (block.type === RichTextBlockType.valueItem && block.data) {
          doVisitItem(
            blockPath,
            block.data as Value,
            false,
            enterValueItem
              ? enterValueItem(path, fieldSpec, block.data as Value, visitContext)
              : visitContext
          );
        }
      }
    }
  }

  doVisitItem([], entity, true, initialVisitContext);
}
