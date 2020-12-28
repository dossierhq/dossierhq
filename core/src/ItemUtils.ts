import type { AdminEntity, Entity, FieldSpecification, FieldValueTypeMap, Schema, Value } from '.';
import { FieldType } from '.';

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

export function visitFieldsRecursively<TVisitContext>({
  schema,
  entity,
  visitor,
  enterValueItem,
  enterList,
  initialVisitContext,
}: {
  schema: Schema;
  entity: Entity | AdminEntity;
  visitor: (
    fieldSpec: FieldSpecification,
    data: unknown,
    visitContext: TVisitContext,
    listIndex: number | undefined
  ) => void;
  enterValueItem: (
    fieldSpec: FieldSpecification,
    valueItem: Value,
    visitContext: TVisitContext
  ) => TVisitContext;
  enterList: (
    fieldSpec: FieldSpecification,
    list: unknown[],
    visitContext: TVisitContext
  ) => TVisitContext;
  initialVisitContext: TVisitContext;
}): void {
  function doVisitItem(
    prefix: string,
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
        throw new Error(`Couldn't find spec for value type ${item._type}`);
      }
      fieldSpecs = valueSpec.fields;
    }

    for (const fieldSpec of fieldSpecs) {
      const fieldValue = item[fieldSpec.name];
      if (fieldValue === null || fieldValue === undefined) {
        continue;
      }
      const fieldPrefix = `${prefix}.${fieldSpec.name}`;
      if (fieldSpec.list) {
        if (!Array.isArray(fieldValue)) {
          throw new Error(`${fieldPrefix}: expected list got ${typeof fieldValue}`);
        }
        const listVisitContext = enterList(fieldSpec, fieldValue, visitContext);
        for (let i = 0; i < fieldValue.length; i += 1) {
          const fieldItemPrefix = `${fieldPrefix}[${i}]`;
          const fieldItem = fieldValue[i];
          visitor(fieldSpec, fieldItem, listVisitContext, i); //TODO fieldItemPrefix
          if (isValueTypeItemField(fieldSpec, fieldItem) && fieldItem) {
            doVisitItem(
              fieldItemPrefix,
              fieldItem,
              false,
              enterValueItem(fieldSpec, fieldItem, listVisitContext)
            );
          }
        }
      } else {
        visitor(fieldSpec, fieldValue, visitContext, undefined); // TODO fieldPrefix,
        if (isValueTypeField(fieldSpec, fieldValue) && fieldValue) {
          doVisitItem(
            fieldPrefix,
            fieldValue,
            false,
            enterValueItem(fieldSpec, fieldValue, visitContext)
          );
        }
      }
    }
  }

  doVisitItem('entity', entity, true, initialVisitContext);
}
