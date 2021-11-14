import type { EntityReference, Result, ErrorType, Location, RichText, ValueItem } from '.';
import { notOk, ok } from '.';

export interface EntityTypeSpecification {
  name: string;
  fields: FieldSpecification[];
}

export interface ValueTypeSpecification {
  name: string;
  fields: FieldSpecification[];
}

export enum FieldType {
  Boolean = 'Boolean',
  //TODO rename to Entity?
  EntityType = 'EntityType',
  Location = 'Location',
  RichText = 'RichText',
  String = 'String',
  //TODO rename to ValueItem?
  ValueType = 'ValueType',
}

export enum RichTextBlockType {
  entity = 'entity',
  valueItem = 'valueItem',
  paragraph = 'paragraph',
}

export interface FieldSpecification {
  name: string;
  /** The type of the field, only values from {@link FieldType} as accepted. */
  type: FieldType | string;
  list?: boolean;
  isName?: boolean;
  /** Applicable when type is EntityType or RichText */
  entityTypes?: string[];
  /** Applicable when type is ValueType or RichText */
  valueTypes?: string[];
  /** Applicable when type is RichText. All block types are enabled if none are specified. The type
   * can either be a standard RichTextBlockType or any type that's enabled.
   * If inlineTypes isn't specified all inline types are enabled. If inlineTypes is an empty array,
   * no inline types are enabled.
   */
  richTextBlocks?: { type: RichTextBlockType | string; inlineTypes?: string[] }[];
}

export interface FieldValueTypeMap {
  [FieldType.Boolean]: boolean;
  [FieldType.EntityType]: EntityReference;
  [FieldType.Location]: Location;
  [FieldType.RichText]: RichText;
  [FieldType.String]: string;
  [FieldType.ValueType]: ValueItem;
}

export interface AdminSchemaSpecification {
  entityTypes: EntityTypeSpecification[];
  valueTypes: ValueTypeSpecification[];
}

export type AdminSchemaSpecificationUpdate = Partial<AdminSchemaSpecification>;

export interface SchemaSpecificationUpdatePayload {
  effect: 'updated' | 'none';
  schemaSpecification: AdminSchemaSpecification;
}

export class Schema {
  readonly spec: AdminSchemaSpecification;

  constructor(spec: AdminSchemaSpecification) {
    this.spec = spec;
  }

  validate(): Result<void, ErrorType.BadRequest> {
    const usedNames = new Set();
    for (const typeSpec of [...this.spec.entityTypes, ...this.spec.valueTypes]) {
      const isValueType = this.spec.valueTypes.includes(typeSpec);

      if (usedNames.has(typeSpec.name)) {
        return notOk.BadRequest(`${typeSpec.name}: Duplicate type name`);
      }
      usedNames.add(typeSpec.name);

      for (const fieldSpec of typeSpec.fields) {
        if (isValueType && fieldSpec.name === 'type') {
          return notOk.BadRequest(
            `${typeSpec.name}.${fieldSpec.name}: Invalid field name for a value type`
          );
        }

        if (!(fieldSpec.type in FieldType)) {
          return notOk.BadRequest(
            `${typeSpec.name}.${fieldSpec.name}: Specified type ${fieldSpec.type} doesn’t exist`
          );
        }

        if (fieldSpec.entityTypes && fieldSpec.entityTypes.length > 0) {
          if (fieldSpec.type !== FieldType.EntityType && fieldSpec.type !== FieldType.RichText) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Field with type ${fieldSpec.type} shouldn’t specify entityTypes`
            );
          }
          for (const referencedTypeName of fieldSpec.entityTypes) {
            if (this.spec.entityTypes.findIndex((x) => x.name === referencedTypeName) < 0) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: Referenced entity type in entityTypes ${referencedTypeName} doesn’t exist`
              );
            }
          }
        }

        if (fieldSpec.valueTypes && fieldSpec.valueTypes.length > 0) {
          if (fieldSpec.type !== FieldType.ValueType && fieldSpec.type !== FieldType.RichText) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Field with type ${fieldSpec.type} shouldn’t specify valueTypes`
            );
          }
          for (const referencedTypeName of fieldSpec.valueTypes) {
            if (this.spec.valueTypes.findIndex((x) => x.name === referencedTypeName) < 0) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: Value type in valueTypes ${referencedTypeName} doesn’t exist`
              );
            }
          }
        }

        if (fieldSpec.richTextBlocks && fieldSpec.richTextBlocks.length > 0) {
          if (fieldSpec.type !== FieldType.RichText) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Field with type ${fieldSpec.type} shouldn’t specify richTextBlocks`
            );
          }

          const paragraph = fieldSpec.richTextBlocks.find(
            (x) => x.type === RichTextBlockType.paragraph
          );
          if (!paragraph) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: richTextBlocks must include paragraph`
            );
          }

          const usedRichTextBlockTypes = new Set();
          for (const richTextBlock of fieldSpec.richTextBlocks) {
            if (usedRichTextBlockTypes.has(richTextBlock.type)) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: richTextBlocks with type ${richTextBlock.type} is duplicated`
              );
            }
            usedRichTextBlockTypes.add(richTextBlock.type);

            if (
              (richTextBlock.type === RichTextBlockType.entity ||
                richTextBlock.type === RichTextBlockType.valueItem) &&
              richTextBlock.inlineTypes &&
              richTextBlock.inlineTypes.length > 0
            ) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: richTextBlocks with type ${richTextBlock.type} shouldn’t specify inlineTypes`
              );
            }
          }
        }
      }
    }

    return ok(undefined);
  }

  getEntityTypeCount(): number {
    return this.spec.entityTypes.length;
  }

  getEntityTypeSpecification(type: string): EntityTypeSpecification | null {
    return this.spec.entityTypes.find((x) => x.name === type) ?? null;
  }

  getEntityFieldSpecification(
    entitySpec: EntityTypeSpecification,
    fieldName: string
  ): FieldSpecification | null {
    return entitySpec.fields.find((x) => x.name === fieldName) ?? null;
  }

  getValueTypeCount(): number {
    return this.spec.valueTypes.length;
  }

  getValueTypeSpecification(type: string): ValueTypeSpecification | null {
    return this.spec.valueTypes.find((x) => x.name === type) ?? null;
  }

  getValueFieldSpecification(
    valueSpec: ValueTypeSpecification,
    fieldName: string
  ): FieldSpecification | null {
    return valueSpec.fields.find((x) => x.name === fieldName) ?? null;
  }

  mergeWith(
    other: AdminSchemaSpecificationUpdate
  ): Result<AdminSchemaSpecification, ErrorType.BadRequest> {
    const schemaSpec: AdminSchemaSpecification = {
      entityTypes: [...this.spec.entityTypes],
      valueTypes: [...this.spec.valueTypes],
    };
    if (other.entityTypes) {
      for (const entitySpec of other.entityTypes) {
        const existingIndex = schemaSpec.entityTypes.findIndex((it) => it.name === entitySpec.name);
        if (existingIndex >= 0) {
          //TODO merge entity type
          schemaSpec.entityTypes[existingIndex] = entitySpec;
        } else {
          schemaSpec.entityTypes.push(entitySpec);
        }
      }
    }
    if (other.valueTypes) {
      for (const valueSpec of other.valueTypes) {
        const existingIndex = schemaSpec.valueTypes.findIndex((it) => it.name === valueSpec.name);
        if (existingIndex >= 0) {
          //TODO merge value type
          schemaSpec.valueTypes[existingIndex] = valueSpec;
        } else {
          schemaSpec.valueTypes.push(valueSpec);
        }
      }
    }
    // TODO normalize
    return ok(schemaSpec);
  }
}
