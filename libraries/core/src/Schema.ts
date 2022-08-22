import type { ErrorType, Result } from './ErrorResult.js';
import { notOk, ok } from './ErrorResult.js';
import type { EntityReference, Location, RichText, ValueItem } from './Types.js';

export interface AdminEntityTypeSpecification {
  name: string;
  adminOnly: boolean;
  fields: AdminFieldSpecification[];
}

export interface AdminValueTypeSpecification {
  name: string;
  adminOnly: boolean;
  fields: AdminFieldSpecification[];
}

export interface AdminEntityTypeSpecificationUpdate {
  name: string;
  adminOnly?: boolean;
  fields: AdminFieldSpecification[];
}

export interface AdminValueTypeSpecificationUpdate {
  name: string;
  adminOnly?: boolean;
  fields: AdminFieldSpecification[];
}

export interface PublishedEntityTypeSpecification {
  name: string;
  fields: PublishedFieldSpecification[];
}

export interface PublishedValueTypeSpecification {
  name: string;
  fields: PublishedFieldSpecification[];
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
  root: 'root',
  text: 'text',
  valueItem: 'valueItem',
} as const;
export type RichTextNodeType = keyof typeof RichTextNodeType;

interface FieldSpecification {
  name: string;
  /** The type of the field, only values from {@link FieldType} as accepted. */
  type: FieldType;
  list?: boolean;
  required?: boolean;
  adminOnly?: boolean;
  isName?: boolean;
  /** Applicable when type is String */
  multiline?: boolean;
  /** Applicable when type is EntityType or RichText */
  entityTypes?: string[];
  /** Applicable when type is ValueType or RichText */
  valueTypes?: string[];
  /** Applicable when type is RichText. All node types are enabled if none are specified. The type
   * can either be a standard RichTextNodeType or any type that's supported.
   */
  richTextNodes?: (RichTextNodeType | string)[];
}

export interface AdminFieldSpecification extends FieldSpecification {
  adminOnly?: boolean;
}

export type PublishedFieldSpecification = FieldSpecification;

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

        if (fieldSpec.richTextNodes && fieldSpec.richTextNodes.length > 0) {
          if (fieldSpec.type !== FieldType.RichText) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Field with type ${fieldSpec.type} shouldn’t specify richTextNodes`
            );
          }

          const usedRichTextNodes = new Set();
          for (const richTextNode of fieldSpec.richTextNodes) {
            if (usedRichTextNodes.has(richTextNode)) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: richTextNodes with type ${richTextNode} is duplicated`
              );
            }
            usedRichTextNodes.add(richTextNode);
          }

          const missingNodeTypes = [
            RichTextNodeType.root,
            RichTextNodeType.paragraph,
            RichTextNodeType.text,
          ].filter((it) => !usedRichTextNodes.has(it));
          if (missingNodeTypes.length > 0) {
            return notOk.BadRequest(
              `${typeSpec.name}.${
                fieldSpec.name
              }: richTextNodes must include ${missingNodeTypes.join(', ')}`
            );
          }

          if (usedRichTextNodes.size > 0) {
            if (
              fieldSpec.entityTypes &&
              fieldSpec.entityTypes.length > 0 &&
              !usedRichTextNodes.has(RichTextNodeType.entity)
            ) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: entityTypes is specified for field, but richTextNodes is missing entity`
              );
            }

            if (
              fieldSpec.valueTypes &&
              fieldSpec.valueTypes.length > 0 &&
              !usedRichTextNodes.has(RichTextNodeType.valueItem)
            ) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: valueTypes is specified for field, but richTextNodes is missing valueItem`
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
  ): AdminFieldSpecification | null {
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
  ): AdminFieldSpecification | null {
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

    function toPublishedFields(fields: AdminFieldSpecification[]): PublishedFieldSpecification[] {
      return fields
        .filter((it) => !it.adminOnly)
        .map((field) => {
          const { adminOnly, ...publishedField } = field;
          return publishedField;
        });
    }

    for (const entitySpec of this.spec.entityTypes) {
      if (entitySpec.adminOnly) {
        continue;
      }
      spec.entityTypes.push({
        name: entitySpec.name,
        fields: toPublishedFields(entitySpec.fields),
      });
    }
    for (const valueSpec of this.spec.valueTypes) {
      if (valueSpec.adminOnly) {
        continue;
      }
      spec.valueTypes.push({ name: valueSpec.name, fields: toPublishedFields(valueSpec.fields) });
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
  ): PublishedFieldSpecification | null {
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
  ): PublishedFieldSpecification | null {
    return valueSpec.fields.find((it) => it.name === fieldName) ?? null;
  }
}
