import type { Component, EntityReference, Location, RichText } from '../Types.js';
import { RichTextNodeType } from '../Types.js';
import type { LooseAutocomplete } from '../utils/TypeUtils.js';

export interface EntityTypeSpecification {
  name: string;
  publishable: boolean;
  authKeyPattern: string | null;
  nameField: string | null;
  fields: FieldSpecification[];
}

export interface ComponentTypeSpecification {
  name: string;
  adminOnly: boolean;
  fields: FieldSpecification[];
}

export interface EntityTypeSpecificationUpdate {
  name: string;
  publishable?: boolean;
  authKeyPattern?: string | null;
  nameField?: string | null;
  fields: FieldSpecificationUpdate[];
}

export interface ComponentTypeSpecificationUpdate {
  name: string;
  adminOnly?: boolean;
  fields: FieldSpecificationUpdate[];
}

export interface PublishedEntityTypeSpecification {
  name: string;
  authKeyPattern: string | null;
  fields: PublishedFieldSpecification[];
}

export interface PublishedComponentTypeSpecification {
  name: string;
  fields: PublishedFieldSpecification[];
}

export const FieldType = {
  Boolean: 'Boolean',
  Component: 'Component',
  Location: 'Location',
  Number: 'Number',
  Reference: 'Reference',
  RichText: 'RichText',
  String: 'String',
} as const;
export type FieldType = (typeof FieldType)[keyof typeof FieldType];

interface SharedFieldSpecification {
  name: string;
  list: boolean;
  required: boolean;
  adminOnly: boolean;
}

export interface BooleanFieldSpecification extends SharedFieldSpecification {
  type: typeof FieldType.Boolean;
}

export interface ComponentFieldSpecification extends SharedFieldSpecification {
  type: typeof FieldType.Component;
  componentTypes: string[];
}

export interface ReferenceFieldSpecification extends SharedFieldSpecification {
  type: typeof FieldType.Reference;
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
  componentTypes: string[];
  /** All node types are enabled if none are specified.
   *
   * The type can either be a standard RichTextNodeType or any type that's supported by the
   * application.
   */
  richTextNodes: LooseAutocomplete<RichTextNodeType>[];
}

export interface StringFieldSpecification extends SharedFieldSpecification {
  type: typeof FieldType.String;
  multiline: boolean;
  matchPattern: string | null;
  values: { value: string }[];
  index: string | null;
}

export type FieldSpecification =
  | BooleanFieldSpecification
  | ComponentFieldSpecification
  | LocationFieldSpecification
  | NumberFieldSpecification
  | ReferenceFieldSpecification
  | RichTextFieldSpecification
  | StringFieldSpecification;

type PartialExcept<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

export type BooleanFieldSpecificationUpdate = PartialExcept<
  BooleanFieldSpecification,
  'name' | 'type'
>;
export type ComponentFieldSpecificationUpdate = PartialExcept<
  ComponentFieldSpecification,
  'name' | 'type'
>;
export type ReferenceFieldSpecificationUpdate = PartialExcept<
  ReferenceFieldSpecification,
  'name' | 'type'
>;
export type LocationFieldSpecificationUpdate = PartialExcept<
  LocationFieldSpecification,
  'name' | 'type'
>;
export type NumberFieldSpecificationUpdate = PartialExcept<
  NumberFieldSpecification,
  'name' | 'type'
>;
export type RichTextFieldSpecificationUpdate = PartialExcept<
  RichTextFieldSpecification,
  'name' | 'type'
>;
export type StringFieldSpecificationUpdate = PartialExcept<
  StringFieldSpecification,
  'name' | 'type'
>;

export type FieldSpecificationUpdate =
  | BooleanFieldSpecificationUpdate
  | ComponentFieldSpecificationUpdate
  | LocationFieldSpecificationUpdate
  | NumberFieldSpecificationUpdate
  | ReferenceFieldSpecificationUpdate
  | RichTextFieldSpecificationUpdate
  | StringFieldSpecificationUpdate;

export type PublishedBooleanFieldSpecification = Omit<BooleanFieldSpecification, 'adminOnly'>;
export type PublishedComponentFieldSpecification = Omit<ComponentFieldSpecification, 'adminOnly'>;
export type PublishedReferenceFieldSpecification = Omit<ReferenceFieldSpecification, 'adminOnly'>;
export type PublishedLocationFieldSpecification = Omit<LocationFieldSpecification, 'adminOnly'>;
export type PublishedNumberFieldSpecification = Omit<NumberFieldSpecification, 'adminOnly'>;
export type PublishedRichTextFieldSpecification = Omit<RichTextFieldSpecification, 'adminOnly'>;
export type PublishedStringFieldSpecification = Omit<StringFieldSpecification, 'adminOnly'>;

export type PublishedFieldSpecification =
  | PublishedBooleanFieldSpecification
  | PublishedComponentFieldSpecification
  | PublishedReferenceFieldSpecification
  | PublishedLocationFieldSpecification
  | PublishedNumberFieldSpecification
  | PublishedRichTextFieldSpecification
  | PublishedStringFieldSpecification;

export interface FieldValueTypeMap {
  [FieldType.Boolean]: boolean;
  [FieldType.Component]: Component;
  [FieldType.Location]: Location;
  [FieldType.Number]: number;
  [FieldType.Reference]: EntityReference;
  [FieldType.RichText]: RichText;
  [FieldType.String]: string;
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
  schemaKind: 'published';
  version: number;
  entityTypes: PublishedEntityTypeSpecification[];
  componentTypes: PublishedComponentTypeSpecification[];
  patterns: SchemaPatternSpecification[];
  indexes: SchemaIndexSpecification[];
}

export interface SchemaSpecification {
  schemaKind: 'full';
  version: number;
  entityTypes: EntityTypeSpecification[];
  componentTypes: ComponentTypeSpecification[];
  patterns: SchemaPatternSpecification[];
  indexes: SchemaIndexSpecification[];
}

export interface SchemaSpecificationWithMigrations extends SchemaSpecification {
  migrations: SchemaVersionMigration[];
}

export interface SchemaVersionMigration {
  version: number;
  actions: SchemaMigrationAction[];
}

export type SchemaMigrationAction =
  | { action: 'renameType'; entityType: string; newName: string }
  | { action: 'renameType'; componentType: string; newName: string }
  | { action: 'renameField'; entityType: string; field: string; newName: string }
  | { action: 'renameField'; componentType: string; field: string; newName: string }
  | { action: 'deleteType'; entityType: string }
  | { action: 'deleteType'; componentType: string }
  | { action: 'deleteField'; entityType: string; field: string }
  | { action: 'deleteField'; componentType: string; field: string };

export type SchemaTransientMigrationAction =
  | { action: 'renameIndex'; index: string; newName: string }
  | { action: 'deleteIndex'; index: string };

export interface SchemaSpecificationUpdate {
  version?: number;
  entityTypes?: EntityTypeSpecificationUpdate[];
  componentTypes?: ComponentTypeSpecificationUpdate[];
  patterns?: SchemaPatternSpecification[];
  indexes?: SchemaIndexSpecification[];
  migrations?: SchemaVersionMigration[];
  transientMigrations?: SchemaTransientMigrationAction[];
}

export interface SchemaSpecificationUpdatePayload<
  TSpec extends SchemaSpecification | SchemaSpecificationWithMigrations = SchemaSpecification,
> {
  effect: 'updated' | 'none';
  schemaSpecification: TSpec;
}

export type LegacySchemaSpecificationWithMigrations =
  | Legacy_V0_4_7_SchemaSpecificationWithMigrations
  | Legacy_V0_6_2_SchemaSpecificationWithMigrations;

export type LegacyEntityTypeSpecification =
  | Legacy_V0_4_7_SchemaSpecificationWithMigrations['entityTypes'][number]
  | Legacy_V0_6_2_SchemaSpecificationWithMigrations['entityTypes'][number];

export type LegacyComponentTypeSpecification =
  | Legacy_V0_4_7_SchemaSpecificationWithMigrations['valueTypes'][number]
  | Legacy_V0_6_2_SchemaSpecificationWithMigrations['componentTypes'][number];

/** In version after 0.4.7:
 * - valueTypes was renamed to componentTypes
 * - field type ValueItem was renamed to Component
 * - field spec validations valueTypes were renamed to componentTypes
 * - migration actions valueType selector was renamed to componentType
 */
interface Legacy_V0_4_7_SchemaSpecificationWithMigrations
  extends Omit<SchemaSpecificationWithMigrations, 'entityTypes' | 'componentTypes' | 'migrations'> {
  entityTypes: (Omit<EntityTypeSpecification, 'publishable' | 'fields'> & {
    adminOnly: boolean;
    fields: Legacy_V0_4_7_FieldSpecification[];
  })[];
  valueTypes: (Omit<ComponentTypeSpecification, 'fields'> & {
    fields: Legacy_V0_4_7_FieldSpecification[];
  })[];
  migrations: (Omit<SchemaVersionMigration, 'actions'> & {
    actions: Legacy_v0_4_7_SchemaMigrationAction[];
  })[];
}

type Legacy_V0_4_7_FieldSpecification<T extends FieldSpecification = FieldSpecification> =
  T extends ComponentFieldSpecification
    ? Omit<ComponentFieldSpecification, 'type' | 'componentTypes'> & {
        type: 'ValueItem';
        valueTypes: string[];
      }
    : T extends RichTextFieldSpecification
      ? Omit<RichTextFieldSpecification, 'componentTypes'> & {
          valueTypes: string[];
        }
      : T;

type Legacy_v0_4_7_SchemaMigrationAction<T extends SchemaMigrationAction = SchemaMigrationAction> =
  T extends {
    componentType: string;
  }
    ? Omit<T, 'componentType'> & { valueType: string }
    : T;

/** In version after 0.6.2:
 * - Entity field type was renamed to Reference
 * - adminOnly in EntityTypeSpecification was renamed to publishable (and inverted)
 */
interface Legacy_V0_6_2_SchemaSpecificationWithMigrations
  extends Omit<SchemaSpecificationWithMigrations, 'entityTypes' | 'componentTypes'> {
  entityTypes: (Omit<EntityTypeSpecification, 'publishable' | 'fields'> & {
    adminOnly: boolean;
    fields: Legacy_V0_6_2_FieldSpecification[];
  })[];
  componentTypes: (Omit<ComponentTypeSpecification, 'fields'> & {
    fields: Legacy_V0_6_2_FieldSpecification[];
  })[];
}

type Legacy_V0_6_2_FieldSpecification<T extends FieldSpecification = FieldSpecification> =
  T extends ReferenceFieldSpecification
    ? Omit<ReferenceFieldSpecification, 'type'> & {
        type: 'Entity';
      }
    : T;

export const REQUIRED_RICH_TEXT_NODES = /* @__PURE__ */ (() => [
  RichTextNodeType.root,
  RichTextNodeType.paragraph,
  RichTextNodeType.text,
  RichTextNodeType.linebreak,
  RichTextNodeType.tab,
])();

export const GROUPED_RICH_TEXT_NODE_TYPES: RichTextNodeType[][] = /* @__PURE__ */ (() => [
  [RichTextNodeType.list, RichTextNodeType.listitem],
  [RichTextNodeType.code, RichTextNodeType['code-highlight']],
])();
