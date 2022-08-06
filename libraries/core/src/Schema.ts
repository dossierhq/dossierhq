import type { ErrorType, Result } from './ErrorResult.js';
import { notOk, ok } from './ErrorResult.js';
import type { EntityReference, Location, RichText, ValueItem } from './Types.js';

export interface AdminEntityTypeSpecification {
  name: string;
  adminOnly: boolean;
  fields: FieldSpecification[];
}

export interface AdminValueTypeSpecification {
  name: string;
  adminOnly: boolean;
  fields: FieldSpecification[];
}

export interface AdminEntityTypeSpecificationUpdate {
  name: string;
  adminOnly?: boolean;
  fields: FieldSpecification[];
}

export interface AdminValueTypeSpecificationUpdate {
  name: string;
  adminOnly?: boolean;
  fields: FieldSpecification[];
}

export interface PublishedEntityTypeSpecification {
  name: string;
  fields: FieldSpecification[];
}

export interface PublishedValueTypeSpecification {
  name: string;
  fields: FieldSpecification[];
}

export const FieldType = {
  Boolean: 'Boolean',
  //TODO rename to Entity?
  EntityType: 'EntityType',
  Location: 'Location',
  RichText: 'RichText',
  String: 'String',
  //TODO rename to ValueItem?
  ValueType: 'ValueType',
} as const;
export type FieldType = keyof typeof FieldType;

export const RichTextNodeType = {
  entity: 'entity',
  paragraph: 'paragraph',
  text: 'text',
  valueItem: 'valueItem',
} as const;
export type RichTextNodeType = keyof typeof RichTextNodeType;

export interface FieldSpecification {
  name: string;
  /** The type of the field, only values from {@link FieldType} as accepted. */
  type: FieldType;
  list?: boolean;
  required?: boolean;
  isName?: boolean;
  /** Applicable when type is String */
  multiline?: boolean;
  /** Applicable when type is EntityType or RichText */
  entityTypes?: string[];
  /** Applicable when type is ValueType or RichText */
  valueTypes?: string[];
  // TODO replace with rich text nodes. no such thing as inline
  /** Applicable when type is RichText. All block types are enabled if none are specified. The type
   * can either be a standard RichTextBlockType or any type that's enabled.
   * If inlineTypes isn't specified all inline types are enabled. If inlineTypes is an empty array,
   * no inline types are enabled.
   */
  richTextBlocks?: { type: RichTextNodeType | string; inlineTypes?: string[] }[];
}

export interface FieldValueTypeMap {
  [FieldType.Boolean]: boolean;
  [FieldType.EntityType]: EntityReference;
  [FieldType.Location]: Location;
  [FieldType.RichText]: RichText;
  [FieldType.String]: string;
  [FieldType.ValueType]: ValueItem;
}

export interface PublishedSchemaSpecification {
  entityTypes: PublishedEntityTypeSpecification[];
  valueTypes: PublishedValueTypeSpecification[];
}

export interface AdminSchemaSpecification {
  entityTypes: AdminEntityTypeSpecification[];
  valueTypes: AdminValueTypeSpecification[];
}

export interface AdminSchemaSpecificationUpdate {
  entityTypes?: AdminEntityTypeSpecificationUpdate[];
  valueTypes?: AdminValueTypeSpecificationUpdate[];
}

export interface SchemaSpecificationUpdatePayload {
  effect: 'updated' | 'none';
  schemaSpecification: AdminSchemaSpecification;
}

export class AdminSchema {
  readonly spec: AdminSchemaSpecification;

  constructor(spec: AdminSchemaSpecification) {
    this.spec = spec;
  }

  validate(): Result<void, typeof ErrorType.BadRequest> {
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

        if ('multiline' in fieldSpec && fieldSpec.type !== FieldType.String) {
          return notOk.BadRequest(
            `${typeSpec.name}.${fieldSpec.name}: Field with type ${fieldSpec.type} shouldn’t specify multiline`
          );
        }

        if (fieldSpec.entityTypes && fieldSpec.entityTypes.length > 0) {
          if (fieldSpec.type !== FieldType.EntityType && fieldSpec.type !== FieldType.RichText) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Field with type ${fieldSpec.type} shouldn’t specify entityTypes`
            );
          }
          for (const referencedTypeName of fieldSpec.entityTypes) {
            const referencedEntityType = this.getEntityTypeSpecification(referencedTypeName);
            if (!referencedEntityType) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: Referenced entity type in entityTypes ${referencedTypeName} doesn’t exist`
              );
            }
            if (referencedEntityType.adminOnly && !typeSpec.adminOnly) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: Referenced entity type in entityTypes (${referencedTypeName}) is adminOnly, but ${typeSpec.name} isn’t`
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
            const referencedValueType = this.getValueTypeSpecification(referencedTypeName);
            if (!referencedValueType) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: Value type in valueTypes ${referencedTypeName} doesn’t exist`
              );
            }
            if (referencedValueType.adminOnly && !typeSpec.adminOnly) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: Referenced value type in valueTypes (${referencedTypeName}) is adminOnly, but ${typeSpec.name} isn’t`
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
            (x) => x.type === RichTextNodeType.paragraph
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
              (richTextBlock.type === RichTextNodeType.entity ||
                richTextBlock.type === RichTextNodeType.valueItem) &&
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

  getEntityTypeSpecification(type: string): AdminEntityTypeSpecification | null {
    return this.spec.entityTypes.find((x) => x.name === type) ?? null;
  }

  getEntityFieldSpecification(
    entitySpec: AdminEntityTypeSpecification,
    fieldName: string
  ): FieldSpecification | null {
    return entitySpec.fields.find((x) => x.name === fieldName) ?? null;
  }

  getValueTypeCount(): number {
    return this.spec.valueTypes.length;
  }

  getValueTypeSpecification(type: string): AdminValueTypeSpecification | null {
    return this.spec.valueTypes.find((x) => x.name === type) ?? null;
  }

  getValueFieldSpecification(
    valueSpec: AdminValueTypeSpecification,
    fieldName: string
  ): FieldSpecification | null {
    return valueSpec.fields.find((x) => x.name === fieldName) ?? null;
  }

  mergeWith(
    other: AdminSchemaSpecificationUpdate
  ): Result<AdminSchemaSpecification, typeof ErrorType.BadRequest> {
    const schemaSpec: AdminSchemaSpecification = {
      entityTypes: [...this.spec.entityTypes],
      valueTypes: [...this.spec.valueTypes],
    };
    if (other.entityTypes) {
      for (const entitySpecUpdate of other.entityTypes) {
        const entitySpec = {
          name: entitySpecUpdate.name,
          adminOnly: entitySpecUpdate.adminOnly ?? false,
          fields: entitySpecUpdate.fields,
        };
        const existingIndex = schemaSpec.entityTypes.findIndex(
          (it) => it.name === entitySpecUpdate.name
        );
        if (existingIndex >= 0) {
          //TODO merge entity type
          schemaSpec.entityTypes[existingIndex] = entitySpec;
        } else {
          schemaSpec.entityTypes.push(entitySpec);
        }
      }
    }
    if (other.valueTypes) {
      for (const valueSpecUpdate of other.valueTypes) {
        const valueSpec = {
          name: valueSpecUpdate.name,
          adminOnly: valueSpecUpdate.adminOnly ?? false,
          fields: valueSpecUpdate.fields,
        };
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

  toPublishedSchema(): PublishedSchema {
    const spec: PublishedSchemaSpecification = {
      entityTypes: [],
      valueTypes: [],
    };

    for (const entitySpec of this.spec.entityTypes) {
      if (entitySpec.adminOnly) {
        continue;
      }
      spec.entityTypes.push({ name: entitySpec.name, fields: entitySpec.fields });
    }
    for (const valueSpec of this.spec.valueTypes) {
      if (valueSpec.adminOnly) {
        continue;
      }
      spec.valueTypes.push({ name: valueSpec.name, fields: valueSpec.fields });
    }

    return new PublishedSchema(spec);
  }
}

export class PublishedSchema {
  readonly spec: PublishedSchemaSpecification;

  constructor(spec: PublishedSchemaSpecification) {
    this.spec = spec;
  }

  getEntityTypeCount(): number {
    return this.spec.entityTypes.length;
  }

  getEntityTypeSpecification(type: string): PublishedEntityTypeSpecification | null {
    return this.spec.entityTypes.find((it) => it.name === type) ?? null;
  }

  getEntityFieldSpecification(
    entitySpec: PublishedEntityTypeSpecification,
    fieldName: string
  ): FieldSpecification | null {
    return entitySpec.fields.find((it) => it.name === fieldName) ?? null;
  }

  getValueTypeCount(): number {
    return this.spec.valueTypes.length;
  }

  getValueTypeSpecification(type: string): PublishedValueTypeSpecification | null {
    return this.spec.valueTypes.find((it) => it.name === type) ?? null;
  }

  getValueFieldSpecification(
    valueSpec: PublishedValueTypeSpecification,
    fieldName: string
  ): FieldSpecification | null {
    return valueSpec.fields.find((it) => it.name === fieldName) ?? null;
  }
}
