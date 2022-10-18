import type { ErrorType, Result } from './ErrorResult.js';
import { notOk, ok } from './ErrorResult.js';
import type { EntityReference, Location, RichText, ValueItem } from './Types.js';

export interface AdminEntityTypeSpecification {
  name: string;
  adminOnly: boolean;
  authKeyPattern: string | null;
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
  authKeyPattern?: string | null;
  fields: AdminFieldSpecification[];
}

export interface AdminValueTypeSpecificationUpdate {
  name: string;
  adminOnly?: boolean;
  fields: AdminFieldSpecification[];
}

export interface PublishedEntityTypeSpecification {
  name: string;
  authKeyPattern: string | null;
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
  entityLink: 'entityLink',
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
  /** Applicable when type is RichText */
  linkEntityTypes?: string[];
  /** Applicable when type is ValueType or RichText */
  valueTypes?: string[];
  /** Applicable when type is RichText. All node types are enabled if none are specified. The type
   * can either be a standard RichTextNodeType or any type that's supported.
   */
  richTextNodes?: (RichTextNodeType | string)[];
  /** Applicable when type is String */
  matchPattern?: string | null;
  /** Applicable when type is String */
  index?: string | null;
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

export interface SchemaPatternSpecification {
  name: string;
  pattern: string;
}

export interface SchemaIndexSpecification {
  name: string;
  type: 'unique';
}

export interface PublishedSchemaSpecification {
  entityTypes: PublishedEntityTypeSpecification[];
  valueTypes: PublishedValueTypeSpecification[];
  patterns: SchemaPatternSpecification[];
  //TODO add indexes?
}

export interface AdminSchemaSpecification {
  entityTypes: AdminEntityTypeSpecification[];
  valueTypes: AdminValueTypeSpecification[];
  patterns: SchemaPatternSpecification[];
  indexes: SchemaIndexSpecification[];
}

export interface AdminSchemaSpecificationUpdate {
  entityTypes?: AdminEntityTypeSpecificationUpdate[];
  valueTypes?: AdminValueTypeSpecificationUpdate[];
  patterns?: SchemaPatternSpecification[];
  indexes?: SchemaIndexSpecification[];
}

export interface SchemaSpecificationUpdatePayload {
  effect: 'updated' | 'none';
  schemaSpecification: AdminSchemaSpecification;
}

export class AdminSchema {
  readonly spec: AdminSchemaSpecification;
  private cachedPatternRegExps: Record<string, RegExp>;

  constructor(spec: AdminSchemaSpecification) {
    this.spec = spec;
    this.cachedPatternRegExps = {};
  }

  validate(): Result<void, typeof ErrorType.BadRequest> {
    const usedNames = new Set<string>();
    for (const typeSpec of [...this.spec.entityTypes, ...this.spec.valueTypes]) {
      const isValueType = this.spec.valueTypes.includes(typeSpec);

      if (usedNames.has(typeSpec.name)) {
        return notOk.BadRequest(`${typeSpec.name}: Duplicate type name`);
      }
      usedNames.add(typeSpec.name);

      if (!isValueType) {
        const authKeyPattern = (typeSpec as AdminEntityTypeSpecification).authKeyPattern;
        if (authKeyPattern) {
          if (!this.getPattern(authKeyPattern)) {
            return notOk.BadRequest(`${typeSpec.name}: Unknown authKeyPattern (${authKeyPattern})`);
          }
        }
      }

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

        if (fieldSpec.linkEntityTypes && fieldSpec.linkEntityTypes.length > 0) {
          if (fieldSpec.type !== FieldType.RichText) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Field with type ${fieldSpec.type} shouldn’t specify linkEntityTypes`
            );
          }
          for (const referencedTypeName of fieldSpec.linkEntityTypes) {
            const referencedEntityType = this.getEntityTypeSpecification(referencedTypeName);
            if (!referencedEntityType) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: Referenced entity type in linkEntityTypes ${referencedTypeName} doesn’t exist`
              );
            }
            if (referencedEntityType.adminOnly && !typeSpec.adminOnly) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: Referenced entity type in linkEntityTypes (${referencedTypeName}) is adminOnly, but ${typeSpec.name} isn’t`
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
              fieldSpec.linkEntityTypes &&
              fieldSpec.linkEntityTypes.length > 0 &&
              !usedRichTextNodes.has(RichTextNodeType.entityLink)
            ) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: linkEntityTypes is specified for field, but richTextNodes is missing entityLink`
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

        if (fieldSpec.matchPattern) {
          if (fieldSpec.type !== FieldType.String) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Field with type ${fieldSpec.type} shouldn’t specify matchPattern`
            );
          }

          const pattern = this.getPattern(fieldSpec.matchPattern);
          if (!pattern) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Unknown matchPattern (${fieldSpec.matchPattern})`
            );
          }
        }
      }
    }

    const usedPatterns = new Set<string>();
    for (const patternSpec of this.spec.patterns) {
      if (usedPatterns.has(patternSpec.name)) {
        return notOk.BadRequest(`${patternSpec.name}: Duplicate pattern name`);
      }
      usedPatterns.add(patternSpec.name);

      try {
        new RegExp(patternSpec.pattern);
      } catch (e) {
        return notOk.BadRequest(`${patternSpec.name}: Invalid regex`);
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

  getPattern(name: string): SchemaPatternSpecification | null {
    return this.spec.patterns.find((it) => it.name === name) ?? null;
  }

  getPatternRegExp(name: string): RegExp | null {
    let regexp = this.cachedPatternRegExps[name];
    if (regexp) return regexp;

    const pattern = this.getPattern(name);
    if (!pattern) return null;

    regexp = new RegExp(pattern.pattern);
    this.cachedPatternRegExps[name] = regexp;
    return regexp;
  }

  getIndex(name: string): SchemaIndexSpecification | null {
    return this.spec.indexes.find((it) => it.name === name) ?? null;
  }

  mergeWith(
    other: AdminSchemaSpecificationUpdate
  ): Result<AdminSchema, typeof ErrorType.BadRequest> {
    const schemaSpec: AdminSchemaSpecification = {
      entityTypes: [...this.spec.entityTypes],
      valueTypes: [...this.spec.valueTypes],
      patterns: [],
      indexes: [],
    };

    if (other.entityTypes) {
      for (const entitySpecUpdate of other.entityTypes) {
        const entitySpec = {
          name: entitySpecUpdate.name,
          adminOnly: entitySpecUpdate.adminOnly ?? false,
          authKeyPattern: entitySpecUpdate.authKeyPattern ?? null,
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

    const usedPatterns = new Set(
      schemaSpec.entityTypes.map((it) => it.authKeyPattern).filter((it) => !!it) as string[]
    );
    for (const typeSpec of [...schemaSpec.entityTypes, ...schemaSpec.valueTypes]) {
      for (const fieldSpec of typeSpec.fields) {
        if (fieldSpec.matchPattern) {
          usedPatterns.add(fieldSpec.matchPattern);
        }
      }
    }

    for (const patternName of [...usedPatterns].sort()) {
      const pattern =
        other.patterns?.find((it) => it.name === patternName) ?? this.getPattern(patternName);
      if (!pattern) {
        return notOk.BadRequest(`Pattern ${patternName} is used, but not defined`);
      }
      schemaSpec.patterns.push(pattern);
    }

    // TODO normalize
    return ok(new AdminSchema(schemaSpec));
  }

  toPublishedSchema(): PublishedSchema {
    const spec: PublishedSchemaSpecification = {
      entityTypes: [],
      valueTypes: [],
      patterns: [],
    };

    function toPublishedFields(fields: AdminFieldSpecification[]): PublishedFieldSpecification[] {
      return fields
        .filter((it) => !it.adminOnly)
        .map((field) => {
          const { adminOnly, ...publishedField } = field;
          return publishedField;
        });
    }

    const usedPatternNames = new Set();
    for (const entitySpec of this.spec.entityTypes) {
      if (entitySpec.adminOnly) {
        continue;
      }
      spec.entityTypes.push({
        name: entitySpec.name,
        authKeyPattern: entitySpec.authKeyPattern,
        fields: toPublishedFields(entitySpec.fields),
      });
      if (entitySpec.authKeyPattern) {
        usedPatternNames.add(entitySpec.authKeyPattern);
      }
    }
    for (const valueSpec of this.spec.valueTypes) {
      if (valueSpec.adminOnly) {
        continue;
      }
      spec.valueTypes.push({ name: valueSpec.name, fields: toPublishedFields(valueSpec.fields) });
    }

    for (const typeSpec of [...spec.entityTypes, ...spec.valueTypes]) {
      for (const fieldSpec of typeSpec.fields) {
        if (fieldSpec.matchPattern) {
          usedPatternNames.add(fieldSpec.matchPattern);
        }
      }
    }
    for (const patternName of [...usedPatternNames].sort()) {
      const pattern = this.spec.patterns.find((it) => it.name === patternName);
      if (pattern) {
        spec.patterns.push(pattern);
      }
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
