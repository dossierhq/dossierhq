import { assertExhaustive } from './Asserts.js';
import type { ErrorType, Result } from './ErrorResult.js';
import { notOk, ok } from './ErrorResult.js';
import type { EntityReference, Location, RichText, ValueItem } from './Types.js';

export interface AdminEntityTypeSpecification {
  name: string;
  adminOnly: boolean;
  authKeyPattern: string | null;
  nameField: string | null;
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
  nameField?: string | null;
  fields: AdminFieldSpecificationUpdate[];
}

export interface AdminValueTypeSpecificationUpdate {
  name: string;
  adminOnly?: boolean;
  fields: AdminFieldSpecificationUpdate[];
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
  Entity: 'Entity',
  Location: 'Location',
  Number: 'Number',
  RichText: 'RichText',
  String: 'String',
  ValueItem: 'ValueItem',
} as const;
export type FieldType = (typeof FieldType)[keyof typeof FieldType];

export const RichTextNodeType = {
  code: 'code',
  'code-highlight': 'code-highlight',
  entity: 'entity',
  entityLink: 'entityLink',
  heading: 'heading',
  linebreak: 'linebreak',
  link: 'link',
  list: 'list',
  listitem: 'listitem',
  paragraph: 'paragraph',
  root: 'root',
  text: 'text',
  valueItem: 'valueItem',
} as const;
export type RichTextNodeType = (typeof RichTextNodeType)[keyof typeof RichTextNodeType];

interface SharedFieldSpecification {
  name: string;
  list: boolean;
  required: boolean;
}

export interface BooleanFieldSpecification extends SharedFieldSpecification {
  type: typeof FieldType.Boolean;
}

export interface EntityFieldSpecification extends SharedFieldSpecification {
  type: typeof FieldType.Entity;
  entityTypes: string[];
}

export interface LocationFieldSpecification extends SharedFieldSpecification {
  type: typeof FieldType.Location;
}

export interface NumberFieldSpecification extends SharedFieldSpecification {
  type: typeof FieldType.Number;
  integer: boolean;
}

export interface RichTextFieldSpecification extends SharedFieldSpecification {
  type: typeof FieldType.RichText;
  entityTypes: string[];
  linkEntityTypes: string[];
  valueTypes: string[];
  /** All node types are enabled if none are specified.
   *
   * The type can either be a standard RichTextNodeType or any type that's supported by the
   * application.
   */
  richTextNodes: (RichTextNodeType | string)[];
}

export interface StringFieldSpecification extends SharedFieldSpecification {
  type: typeof FieldType.String;
  multiline: boolean;
  matchPattern: string | null;
  values: { value: string }[];
  index: string | null;
}

export interface ValueItemFieldSpecification extends SharedFieldSpecification {
  type: typeof FieldType.ValueItem;
  valueTypes: string[];
}

export type FieldSpecification =
  | BooleanFieldSpecification
  | EntityFieldSpecification
  | LocationFieldSpecification
  | NumberFieldSpecification
  | RichTextFieldSpecification
  | StringFieldSpecification
  | ValueItemFieldSpecification;

export type AdminFieldSpecification<TFieldSpec extends FieldSpecification = FieldSpecification> =
  TFieldSpec & {
    adminOnly: boolean;
  };

type PartialExcept<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

export type AdminBooleanFieldSpecificationUpdate = PartialExcept<
  AdminFieldSpecification<BooleanFieldSpecification>,
  'name' | 'type'
>;
export type AdminEntityFieldSpecificationUpdate = PartialExcept<
  AdminFieldSpecification<EntityFieldSpecification>,
  'name' | 'type'
>;
export type AdminLocationFieldSpecificationUpdate = PartialExcept<
  AdminFieldSpecification<LocationFieldSpecification>,
  'name' | 'type'
>;
export type AdminNumberFieldSpecificationUpdate = PartialExcept<
  AdminFieldSpecification<NumberFieldSpecification>,
  'name' | 'type'
>;
export type AdminRichTextFieldSpecificationUpdate = PartialExcept<
  AdminFieldSpecification<RichTextFieldSpecification>,
  'name' | 'type'
>;
export type AdminStringFieldSpecificationUpdate = PartialExcept<
  AdminFieldSpecification<StringFieldSpecification>,
  'name' | 'type'
>;
export type AdminValueItemFieldSpecificationUpdate = PartialExcept<
  AdminFieldSpecification<ValueItemFieldSpecification>,
  'name' | 'type'
>;

export type AdminFieldSpecificationUpdate =
  | AdminBooleanFieldSpecificationUpdate
  | AdminEntityFieldSpecificationUpdate
  | AdminLocationFieldSpecificationUpdate
  | AdminNumberFieldSpecificationUpdate
  | AdminRichTextFieldSpecificationUpdate
  | AdminStringFieldSpecificationUpdate
  | AdminValueItemFieldSpecificationUpdate;

export type PublishedFieldSpecification = FieldSpecification;

export interface FieldValueTypeMap {
  [FieldType.Boolean]: boolean;
  [FieldType.Entity]: EntityReference;
  [FieldType.Location]: Location;
  [FieldType.Number]: number;
  [FieldType.RichText]: RichText;
  [FieldType.String]: string;
  [FieldType.ValueItem]: ValueItem;
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
  indexes: SchemaIndexSpecification[];
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

const CAMEL_CASE_PATTERN = /^[a-z][a-zA-Z0-9_]*$/;
const PASCAL_CASE_PATTERN = /^[A-Z][a-zA-Z0-9_]*$/;

const REQUIRED_RICH_TEXT_NODES = [
  RichTextNodeType.root,
  RichTextNodeType.paragraph,
  RichTextNodeType.text,
  RichTextNodeType.linebreak,
];

const GROUPED_RICH_TEXT_NODE_TYPES: RichTextNodeType[][] = [
  [RichTextNodeType.list, RichTextNodeType.listitem],
  [RichTextNodeType.code, RichTextNodeType['code-highlight']],
];

const ADMIN_SHARED_FIELD_SPECIFICATION_KEYS = [
  'name',
  'list',
  'required',
  'adminOnly',
  'type',
] as const;
const ADMIN_FIELD_SPECIFICATION_KEYS: {
  Boolean: readonly (keyof AdminFieldSpecification<BooleanFieldSpecification>)[];
  Entity: readonly (keyof AdminFieldSpecification<EntityFieldSpecification>)[];
  Location: readonly (keyof AdminFieldSpecification<LocationFieldSpecification>)[];
  Number: readonly (keyof AdminFieldSpecification<NumberFieldSpecification>)[];
  RichText: readonly (keyof AdminFieldSpecification<RichTextFieldSpecification>)[];
  String: readonly (keyof AdminFieldSpecification<StringFieldSpecification>)[];
  ValueItem: readonly (keyof AdminFieldSpecification<ValueItemFieldSpecification>)[];
} = {
  [FieldType.Boolean]: ADMIN_SHARED_FIELD_SPECIFICATION_KEYS,
  [FieldType.Entity]: [...ADMIN_SHARED_FIELD_SPECIFICATION_KEYS, 'entityTypes'],
  [FieldType.Location]: ADMIN_SHARED_FIELD_SPECIFICATION_KEYS,
  [FieldType.Number]: [...ADMIN_SHARED_FIELD_SPECIFICATION_KEYS, 'integer'],
  [FieldType.RichText]: [
    ...ADMIN_SHARED_FIELD_SPECIFICATION_KEYS,
    'entityTypes',
    'linkEntityTypes',
    'valueTypes',
    'richTextNodes',
  ],
  [FieldType.String]: [
    ...ADMIN_SHARED_FIELD_SPECIFICATION_KEYS,
    'multiline',
    'matchPattern',
    'values',
    'index',
  ],
  [FieldType.ValueItem]: [...ADMIN_SHARED_FIELD_SPECIFICATION_KEYS, 'valueTypes'],
};

export class AdminSchema {
  readonly spec: AdminSchemaSpecification;
  private cachedPatternRegExps: Record<string, RegExp>;
  private cachedPublishedSchema: PublishedSchema | null = null;

  static createAndValidate(
    update: AdminSchemaSpecificationUpdate
  ): Result<AdminSchema, typeof ErrorType.BadRequest> {
    const emptySpec: AdminSchemaSpecification = {
      entityTypes: [],
      valueTypes: [],
      patterns: [],
      indexes: [],
    };
    const empty = new AdminSchema(emptySpec);
    return empty.updateAndValidate(update);
  }

  constructor(spec: AdminSchemaSpecification) {
    this.spec = spec;
    this.cachedPatternRegExps = {};
  }

  validate(): Result<void, typeof ErrorType.BadRequest> {
    const usedTypeNames = new Set<string>();
    for (const typeSpec of [...this.spec.entityTypes, ...this.spec.valueTypes]) {
      const isValueType = this.spec.valueTypes.includes(typeSpec);

      if (!PASCAL_CASE_PATTERN.test(typeSpec.name)) {
        return notOk.BadRequest(
          `${typeSpec.name}: The type name has to start with an upper-case letter (A-Z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as MyType_123`
        );
      }
      if (usedTypeNames.has(typeSpec.name)) {
        return notOk.BadRequest(`${typeSpec.name}: Duplicate type name`);
      }
      usedTypeNames.add(typeSpec.name);

      if (!isValueType) {
        const authKeyPattern = (typeSpec as AdminEntityTypeSpecification).authKeyPattern;
        if (authKeyPattern) {
          if (!this.getPattern(authKeyPattern)) {
            return notOk.BadRequest(`${typeSpec.name}: Unknown authKeyPattern (${authKeyPattern})`);
          }
        }
        const nameField = (typeSpec as AdminEntityTypeSpecification).nameField;
        if (nameField) {
          const nameFieldSpec = typeSpec.fields.find((fieldSpec) => fieldSpec.name === nameField);
          if (!nameFieldSpec) {
            return notOk.BadRequest(
              `${typeSpec.name}: Found no field matching nameField (${nameField})`
            );
          }
          if (nameFieldSpec.type !== FieldType.String || nameFieldSpec.list) {
            return notOk.BadRequest(
              `${typeSpec.name}: nameField (${nameField}) should be a string (non-list)`
            );
          }
        }
      }

      const usedFieldNames = new Set<string>();
      for (const fieldSpec of typeSpec.fields) {
        if (!CAMEL_CASE_PATTERN.test(fieldSpec.name)) {
          return notOk.BadRequest(
            `${typeSpec.name}.${fieldSpec.name}: The field name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myField_123`
          );
        }
        if (isValueType && fieldSpec.name === 'type') {
          return notOk.BadRequest(
            `${typeSpec.name}.${fieldSpec.name}: Invalid field name for a value type`
          );
        }
        if (usedFieldNames.has(fieldSpec.name)) {
          return notOk.BadRequest(`${typeSpec.name}.${fieldSpec.name}: Duplicate field name`);
        }
        usedFieldNames.add(fieldSpec.name);

        if (!(fieldSpec.type in FieldType)) {
          return notOk.BadRequest(
            `${typeSpec.name}.${fieldSpec.name}: Specified type ${fieldSpec.type} doesn’t exist`
          );
        }

        for (const key of Object.keys(fieldSpec)) {
          if (!(ADMIN_FIELD_SPECIFICATION_KEYS[fieldSpec.type] as string[]).includes(key)) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Field with type ${fieldSpec.type} shouldn’t specify ${key}`
            );
          }
        }

        if (
          (fieldSpec.type === FieldType.Entity || fieldSpec.type === FieldType.RichText) &&
          fieldSpec.entityTypes &&
          fieldSpec.entityTypes.length > 0
        ) {
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

        if (
          fieldSpec.type === FieldType.RichText &&
          fieldSpec.linkEntityTypes &&
          fieldSpec.linkEntityTypes.length > 0
        ) {
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

        if (
          (fieldSpec.type === FieldType.ValueItem || fieldSpec.type === FieldType.RichText) &&
          fieldSpec.valueTypes &&
          fieldSpec.valueTypes.length > 0
        ) {
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

        if (
          fieldSpec.type === FieldType.RichText &&
          fieldSpec.richTextNodes &&
          fieldSpec.richTextNodes.length > 0
        ) {
          const usedRichTextNodes = new Set<string>();
          for (const richTextNode of fieldSpec.richTextNodes) {
            if (usedRichTextNodes.has(richTextNode)) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: richTextNodes with type ${richTextNode} is duplicated`
              );
            }
            usedRichTextNodes.add(richTextNode);
          }

          const missingNodeTypes = REQUIRED_RICH_TEXT_NODES.filter(
            (it) => !usedRichTextNodes.has(it)
          );
          if (missingNodeTypes.length > 0) {
            return notOk.BadRequest(
              `${typeSpec.name}.${
                fieldSpec.name
              }: richTextNodes must include ${missingNodeTypes.join(', ')}`
            );
          }

          for (const nodeGroup of GROUPED_RICH_TEXT_NODE_TYPES) {
            const usedNodesInGroup = nodeGroup.filter((it) => usedRichTextNodes.has(it));
            if (usedNodesInGroup.length > 0 && usedNodesInGroup.length !== nodeGroup.length) {
              const unusedNodesInGroup = nodeGroup.filter((it) => !usedRichTextNodes.has(it));
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: richTextNodes includes ${usedNodesInGroup.join(
                  ', '
                )} but must also include related ${unusedNodesInGroup.join(', ')}`
              );
            }
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

        if (fieldSpec.type === FieldType.String && fieldSpec.matchPattern) {
          const pattern = this.getPattern(fieldSpec.matchPattern);
          if (!pattern) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Unknown matchPattern (${fieldSpec.matchPattern})`
            );
          }
        }

        if (
          fieldSpec.type === FieldType.String &&
          fieldSpec.matchPattern &&
          fieldSpec.values.length > 0
        ) {
          return notOk.BadRequest(
            `${typeSpec.name}.${fieldSpec.name}: Can’t specify both matchPattern and values`
          );
        }

        if (fieldSpec.type === FieldType.String && fieldSpec.index) {
          const index = this.getIndex(fieldSpec.index);
          if (!index) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Unknown index (${fieldSpec.index})`
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
      if (!CAMEL_CASE_PATTERN.test(patternSpec.name)) {
        return notOk.BadRequest(
          `${patternSpec.name}: The pattern name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myPattern_123`
        );
      }
      usedPatterns.add(patternSpec.name);

      try {
        new RegExp(patternSpec.pattern);
      } catch (e) {
        return notOk.BadRequest(`${patternSpec.name}: Invalid regex`);
      }
    }

    const usedIndexes = new Set<string>();
    for (const indexSpec of this.spec.indexes) {
      if (usedIndexes.has(indexSpec.name)) {
        return notOk.BadRequest(`${indexSpec.name}: Duplicate index name`);
      }
      if (!CAMEL_CASE_PATTERN.test(indexSpec.name)) {
        return notOk.BadRequest(
          `${indexSpec.name}: The index name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myIndex_123`
        );
      }
      usedIndexes.add(indexSpec.name);
    }

    return ok(undefined);
  }

  getEntityTypeCount(): number {
    return this.spec.entityTypes.length;
  }

  getEntityTypeSpecification(type: string): AdminEntityTypeSpecification | null {
    return this.spec.entityTypes.find((it) => it.name === type) ?? null;
  }

  getEntityFieldSpecification(
    entitySpec: AdminEntityTypeSpecification,
    fieldName: string
  ): AdminFieldSpecification | null {
    return entitySpec.fields.find((it) => it.name === fieldName) ?? null;
  }

  getValueTypeCount(): number {
    return this.spec.valueTypes.length;
  }

  getValueTypeSpecification(type: string): AdminValueTypeSpecification | null {
    return this.spec.valueTypes.find((it) => it.name === type) ?? null;
  }

  getValueFieldSpecification(
    valueSpec: AdminValueTypeSpecification,
    fieldName: string
  ): AdminFieldSpecification | null {
    return valueSpec.fields.find((it) => it.name === fieldName) ?? null;
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

  updateAndValidate(
    update: AdminSchemaSpecificationUpdate
  ): Result<AdminSchema, typeof ErrorType.BadRequest> {
    const schemaSpec: AdminSchemaSpecification = {
      entityTypes: [...this.spec.entityTypes],
      valueTypes: [...this.spec.valueTypes],
      patterns: [],
      indexes: [],
    };

    // Merge entity types
    if (update.entityTypes) {
      for (const entitySpecUpdate of update.entityTypes) {
        const existingIndex = schemaSpec.entityTypes.findIndex(
          (it) => it.name === entitySpecUpdate.name
        );
        const existingEntitySpec =
          existingIndex >= 0 ? schemaSpec.entityTypes[existingIndex] : null;

        const adminOnly = valueOrExistingOrDefault(
          entitySpecUpdate.adminOnly,
          existingEntitySpec?.adminOnly,
          false
        );
        const authKeyPattern = valueOrExistingOrDefault(
          entitySpecUpdate.authKeyPattern,
          existingEntitySpec?.authKeyPattern,
          null
        );
        const nameField = valueOrExistingOrDefault(
          entitySpecUpdate.nameField,
          existingEntitySpec?.nameField,
          null
        );

        if (existingEntitySpec) {
          if (existingEntitySpec.adminOnly !== adminOnly) {
            return notOk.BadRequest(
              `${existingEntitySpec.name}: Can’t change the value of adminOnly. Requested ${adminOnly} but is ${existingEntitySpec.adminOnly}`
            );
          }
        }

        const collectFieldsResult = collectFieldSpecsFromUpdates(
          entitySpecUpdate.fields,
          existingEntitySpec
        );
        if (collectFieldsResult.isError()) return collectFieldsResult;
        const entitySpec: AdminEntityTypeSpecification = {
          name: entitySpecUpdate.name,
          adminOnly,
          authKeyPattern,
          nameField,
          fields: collectFieldsResult.value,
        };
        if (existingIndex >= 0) {
          schemaSpec.entityTypes[existingIndex] = entitySpec;
        } else {
          schemaSpec.entityTypes.push(entitySpec);
        }

        // Version 0.2.3: moved isName from field to nameField on entity types, isName is deprecated
        const fieldWithIsName = entitySpecUpdate.fields.find((it) => 'isName' in it);
        if (fieldWithIsName) {
          return notOk.BadRequest(
            `${entitySpec.name}.${fieldWithIsName.name}: isName is specified, use nameField on the type instead`
          );
        }
      }
    }

    // Merge value types
    if (update.valueTypes) {
      for (const valueSpecUpdate of update.valueTypes) {
        const existingIndex = schemaSpec.valueTypes.findIndex(
          (it) => it.name === valueSpecUpdate.name
        );
        const existingValueSpec = existingIndex >= 0 ? schemaSpec.valueTypes[existingIndex] : null;

        const adminOnly = valueOrExistingOrDefault(
          valueSpecUpdate.adminOnly,
          existingValueSpec?.adminOnly,
          false
        );

        if (existingValueSpec) {
          if (existingValueSpec.adminOnly !== adminOnly) {
            return notOk.BadRequest(
              `${valueSpecUpdate.name}: Can’t change the value of adminOnly. Requested ${adminOnly} but is ${existingValueSpec.adminOnly}`
            );
          }
        }

        const collectFieldsResult = collectFieldSpecsFromUpdates(
          valueSpecUpdate.fields,
          existingValueSpec
        );
        if (collectFieldsResult.isError()) return collectFieldsResult;
        const valueSpec = {
          name: valueSpecUpdate.name,
          adminOnly,
          fields: collectFieldsResult.value,
        };
        if (existingIndex >= 0) {
          schemaSpec.valueTypes[existingIndex] = valueSpec;
        } else {
          schemaSpec.valueTypes.push(valueSpec);
        }
      }
    }

    // Check with patterns and indexes are used
    const usedPatterns = new Set(
      schemaSpec.entityTypes.map((it) => it.authKeyPattern).filter((it) => !!it) as string[]
    );
    const usedIndexes = new Set<string>();
    for (const typeSpec of [...schemaSpec.entityTypes, ...schemaSpec.valueTypes]) {
      for (const fieldSpec of typeSpec.fields) {
        if (fieldSpec.type !== FieldType.String) continue;
        if (fieldSpec.matchPattern) {
          usedPatterns.add(fieldSpec.matchPattern);
        }
        if (fieldSpec.index) {
          usedIndexes.add(fieldSpec.index);
        }
      }
    }

    // Merge used patterns
    for (const patternName of [...usedPatterns].sort()) {
      const pattern =
        update.patterns?.find((it) => it.name === patternName) ?? this.getPattern(patternName);
      if (!pattern) {
        return notOk.BadRequest(`Pattern ${patternName} is used, but not defined`);
      }
      schemaSpec.patterns.push(pattern);
    }

    // Merge used indexes
    for (const indexName of [...usedIndexes].sort()) {
      const index = update.indexes?.find((it) => it.name === indexName) ?? this.getIndex(indexName);
      if (!index) {
        return notOk.BadRequest(`Index ${indexName} is used, but not defined`);
      }
      schemaSpec.indexes.push(index);
    }

    // Sort everything
    schemaSpec.entityTypes.sort((a, b) => a.name.localeCompare(b.name));
    schemaSpec.valueTypes.sort((a, b) => a.name.localeCompare(b.name));
    schemaSpec.patterns.sort((a, b) => a.name.localeCompare(b.name));
    schemaSpec.indexes.sort((a, b) => a.name.localeCompare(b.name));

    // Validate
    const updatedSchema = new AdminSchema(schemaSpec);
    const validateResult = updatedSchema.validate();
    if (validateResult.isError()) return validateResult;

    return ok(updatedSchema);
  }

  toPublishedSchema(): PublishedSchema {
    if (this.cachedPublishedSchema) {
      return this.cachedPublishedSchema;
    }

    const spec: PublishedSchemaSpecification = {
      entityTypes: [],
      valueTypes: [],
      patterns: [],
      indexes: [],
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

    const usedIndexNames = new Set();
    for (const typeSpec of [...spec.entityTypes, ...spec.valueTypes]) {
      for (const fieldSpec of typeSpec.fields) {
        if (fieldSpec.type !== FieldType.String) continue;
        if (fieldSpec.matchPattern) {
          usedPatternNames.add(fieldSpec.matchPattern);
        }
        if (fieldSpec.index) {
          usedIndexNames.add(fieldSpec.index);
        }
      }
    }

    for (const patternName of [...usedPatternNames].sort()) {
      const pattern = this.spec.patterns.find((it) => it.name === patternName);
      if (pattern) {
        spec.patterns.push(pattern);
      }
    }

    for (const indexName of [...usedIndexNames].sort()) {
      const index = this.spec.indexes.find((it) => it.name === indexName);
      if (index) {
        spec.indexes.push(index);
      }
    }

    this.cachedPublishedSchema = new PublishedSchema(spec);
    return this.cachedPublishedSchema;
  }
}

function collectFieldSpecsFromUpdates(
  fieldUpdates: AdminFieldSpecificationUpdate[],
  existingTypeSpec: AdminEntityTypeSpecification | AdminValueTypeSpecification | null
): Result<AdminFieldSpecification[], typeof ErrorType.BadRequest> {
  const fields: AdminFieldSpecification[] = [];
  const usedFieldNames = new Set<string>();
  for (const fieldUpdate of fieldUpdates) {
    const fieldResult = mergeAndNormalizeUpdatedFieldSpec(fieldUpdate, existingTypeSpec);
    if (fieldResult.isError()) return fieldResult;
    fields.push(fieldResult.value);

    usedFieldNames.add(fieldUpdate.name);
  }

  // Add existing fields that are not updated
  if (existingTypeSpec) {
    for (const fieldSpec of existingTypeSpec.fields) {
      if (!usedFieldNames.has(fieldSpec.name)) {
        fields.push(fieldSpec);
      }
    }
  }

  return ok(fields);
}

function mergeAndNormalizeUpdatedFieldSpec(
  fieldSpecUpdate: AdminFieldSpecificationUpdate,
  existingTypeSpec: AdminEntityTypeSpecification | AdminValueTypeSpecification | null
): Result<AdminFieldSpecification, typeof ErrorType.BadRequest> {
  const existingFieldSpec = existingTypeSpec?.fields.find((it) => it.name === fieldSpecUpdate.name);

  const { name, type } = fieldSpecUpdate;
  const list = valueOrExistingOrDefault(fieldSpecUpdate.list, existingFieldSpec?.list, false);
  const required = valueOrExistingOrDefault(
    fieldSpecUpdate.required,
    existingFieldSpec?.required,
    false
  );
  const adminOnly = valueOrExistingOrDefault(
    fieldSpecUpdate.adminOnly,
    existingFieldSpec?.adminOnly,
    false
  );

  if (existingTypeSpec && existingFieldSpec) {
    const typeName = existingTypeSpec.name;
    if (existingFieldSpec.type !== type) {
      return notOk.BadRequest(
        `${typeName}.${name}: Can’t change type of field. Requested ${type} but is ${existingFieldSpec.type}`
      );
    }
    if (existingFieldSpec.list !== list) {
      return notOk.BadRequest(
        `${typeName}.${name}: Can’t change the value of list. Requested ${list} but is ${existingFieldSpec.list}`
      );
    }
    if (existingFieldSpec.adminOnly !== adminOnly) {
      return notOk.BadRequest(
        `${typeName}.${name}: Can’t change the value of adminOnly. Requested ${adminOnly} but is ${existingFieldSpec.adminOnly}`
      );
    }
  }

  switch (type) {
    case FieldType.Boolean:
      return ok({ name, type, list, required, adminOnly });
    case FieldType.Entity: {
      const existingEntityFieldSpec = existingFieldSpec as
        | AdminFieldSpecification<EntityFieldSpecification>
        | undefined;
      const entityTypes = sortAndRemoveDuplicates(
        valueOrExistingOrDefault(
          fieldSpecUpdate.entityTypes,
          existingEntityFieldSpec?.entityTypes,
          []
        )
      );
      return ok({
        name,
        type,
        list,
        required,
        adminOnly,
        entityTypes,
      });
    }
    case FieldType.Location:
      return ok({ name, type, list, required, adminOnly });
    case FieldType.Number: {
      const existingNumberFieldSpec = existingFieldSpec as
        | AdminFieldSpecification<NumberFieldSpecification>
        | undefined;
      const integer = valueOrExistingOrDefault(
        fieldSpecUpdate.integer,
        existingNumberFieldSpec?.integer,
        false
      );
      return ok({
        name,
        type,
        list,
        required,
        adminOnly,
        integer,
      });
    }
    case FieldType.RichText: {
      const existingRichTextFieldSpec = existingFieldSpec as
        | AdminFieldSpecification<RichTextFieldSpecification>
        | undefined;

      const richTextNodes = sortAndRemoveDuplicates(
        valueOrExistingOrDefault(
          fieldSpecUpdate.richTextNodes,
          existingRichTextFieldSpec?.richTextNodes,
          []
        )
      );

      const entityTypes = sortAndRemoveDuplicates(
        valueOrExistingOrDefault(
          fieldSpecUpdate.entityTypes,
          existingRichTextFieldSpec?.entityTypes,
          []
        )
      );

      const linkEntityTypes = sortAndRemoveDuplicates(
        valueOrExistingOrDefault(
          fieldSpecUpdate.linkEntityTypes,
          existingRichTextFieldSpec?.linkEntityTypes,
          []
        )
      );

      const valueTypes = sortAndRemoveDuplicates(
        valueOrExistingOrDefault(
          fieldSpecUpdate.valueTypes,
          existingRichTextFieldSpec?.valueTypes,
          []
        )
      );

      return ok({
        name,
        type,
        list,
        required,
        adminOnly,
        richTextNodes,
        entityTypes,
        linkEntityTypes,
        valueTypes,
      });
    }
    case FieldType.String: {
      const existingStringFieldSpec = existingFieldSpec as
        | AdminFieldSpecification<StringFieldSpecification>
        | undefined;

      const multiline = valueOrExistingOrDefault(
        fieldSpecUpdate.multiline,
        existingStringFieldSpec?.multiline,
        false
      );

      const matchPattern = valueOrExistingOrDefault(
        fieldSpecUpdate.matchPattern,
        existingStringFieldSpec?.matchPattern,
        null
      );

      const values = [
        ...valueOrExistingOrDefault(fieldSpecUpdate.values, existingStringFieldSpec?.values, []),
      ].sort((a, b) => a.value.localeCompare(b.value));
      removeDuplicatesFromSorted(values, (it) => it.value);

      const index = valueOrExistingOrDefault(
        fieldSpecUpdate.index,
        existingStringFieldSpec?.index,
        null
      );

      if (existingStringFieldSpec) {
        if (existingStringFieldSpec.index !== index) {
          return notOk.BadRequest(
            `${existingTypeSpec?.name}.${name}: Can’t change the value of index. Requested ${index} but is ${existingStringFieldSpec.index}`
          );
        }
      }

      return ok({
        name,
        type,
        list,
        required,
        adminOnly,
        multiline,
        matchPattern,
        values,
        index,
      });
    }
    case FieldType.ValueItem: {
      const existingValueItemFieldSpec = existingFieldSpec as
        | AdminFieldSpecification<ValueItemFieldSpecification>
        | undefined;
      const valueTypes = sortAndRemoveDuplicates(
        valueOrExistingOrDefault(
          fieldSpecUpdate.valueTypes,
          existingValueItemFieldSpec?.valueTypes,
          []
        )
      );
      return ok({
        name,
        type,
        list,
        required,
        adminOnly,
        valueTypes,
      });
    }
    default:
      assertExhaustive(type);
  }
}

function valueOrExistingOrDefault<T>(
  update: T | undefined,
  existing: T | undefined,
  defaultValue: T
): T {
  if (update !== undefined) return update;
  if (existing !== undefined) return existing;
  return defaultValue;
}

function sortAndRemoveDuplicates(values: string[]) {
  if (values.length <= 1) {
    return values;
  }
  const copy = [...values].sort();
  removeDuplicatesFromSorted(copy);
  return copy;
}

function removeDuplicatesFromSorted<T>(values: T[], predicate: (value: T) => unknown = (it) => it) {
  for (let i = values.length - 1; i > 0; i--) {
    if (predicate(values[i]) === predicate(values[i - 1])) {
      values.splice(i, 1);
    }
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

  getIndex(name: string): SchemaIndexSpecification | null {
    return this.spec.indexes.find((it) => it.name === name) ?? null;
  }
}
