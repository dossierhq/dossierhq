import type { Component, EntityReference, Location, RichText } from '../Types.js';
import { RichTextNodeType } from '../Types.js';
import type { LooseAutocomplete } from '../utils/TypeUtils.js';

export interface AdminEntityTypeSpecification {
  name: string;
  adminOnly: boolean;
  authKeyPattern: string | null;
  nameField: string | null;
  fields: AdminFieldSpecification[];
}

export interface AdminComponentTypeSpecification {
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

export interface AdminComponentTypeSpecificationUpdate {
  name: string;
  adminOnly?: boolean;
  fields: AdminFieldSpecificationUpdate[];
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

export type AdminFieldSpecification<TFieldSpec extends FieldSpecification = FieldSpecification> =
  TFieldSpec & {
    adminOnly: boolean;
  };

type PartialExcept<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

export type AdminBooleanFieldSpecificationUpdate = PartialExcept<
  AdminFieldSpecification<BooleanFieldSpecification>,
  'name' | 'type'
>;
export type AdminComponentFieldSpecificationUpdate = PartialExcept<
  AdminFieldSpecification<ComponentFieldSpecification>,
  'name' | 'type'
>;
export type AdminReferenceFieldSpecificationUpdate = PartialExcept<
  AdminFieldSpecification<ReferenceFieldSpecification>,
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

export type AdminFieldSpecificationUpdate =
  | AdminBooleanFieldSpecificationUpdate
  | AdminComponentFieldSpecificationUpdate
  | AdminLocationFieldSpecificationUpdate
  | AdminNumberFieldSpecificationUpdate
  | AdminReferenceFieldSpecificationUpdate
  | AdminRichTextFieldSpecificationUpdate
  | AdminStringFieldSpecificationUpdate;

export type PublishedFieldSpecification = FieldSpecification;

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

export interface AdminSchemaSpecification {
  schemaKind: 'admin';
  version: number;
  entityTypes: AdminEntityTypeSpecification[];
  componentTypes: AdminComponentTypeSpecification[];
  patterns: SchemaPatternSpecification[];
  indexes: SchemaIndexSpecification[];
}

export interface AdminSchemaSpecificationWithMigrations extends AdminSchemaSpecification {
  migrations: AdminSchemaVersionMigration[];
}

export interface AdminSchemaVersionMigration {
  version: number;
  actions: AdminSchemaMigrationAction[];
}

export type AdminSchemaMigrationAction =
  | { action: 'renameType'; entityType: string; newName: string }
  | { action: 'renameType'; componentType: string; newName: string }
  | { action: 'renameField'; entityType: string; field: string; newName: string }
  | { action: 'renameField'; componentType: string; field: string; newName: string }
  | { action: 'deleteType'; entityType: string }
  | { action: 'deleteType'; componentType: string }
  | { action: 'deleteField'; entityType: string; field: string }
  | { action: 'deleteField'; componentType: string; field: string };

export type AdminSchemaTransientMigrationAction =
  | { action: 'renameIndex'; index: string; newName: string }
  | { action: 'deleteIndex'; index: string };

export interface AdminSchemaSpecificationUpdate {
  version?: number;
  entityTypes?: AdminEntityTypeSpecificationUpdate[];
  componentTypes?: AdminComponentTypeSpecificationUpdate[];
  patterns?: SchemaPatternSpecification[];
  indexes?: SchemaIndexSpecification[];
  migrations?: AdminSchemaVersionMigration[];
  transientMigrations?: AdminSchemaTransientMigrationAction[];
}

export interface SchemaSpecificationUpdatePayload<
  TSpec extends
    | AdminSchemaSpecification
    | AdminSchemaSpecificationWithMigrations = AdminSchemaSpecification,
> {
  effect: 'updated' | 'none';
  schemaSpecification: TSpec;
}

export type LegacyAdminSchemaSpecificationWithMigrations =
  | Legacy_V0_4_7_AdminSchemaSpecificationWithMigrations
  | Legacy_V0_6_2_AdminSchemaSpecificationWithMigrations;

export type LegacyAdminEntityTypeSpecification =
  | Legacy_V0_4_7_AdminSchemaSpecificationWithMigrations['entityTypes'][number]
  | Legacy_V0_6_2_AdminSchemaSpecificationWithMigrations['entityTypes'][number];

export type LegacyAdminComponentTypeSpecification =
  | Legacy_V0_4_7_AdminSchemaSpecificationWithMigrations['valueTypes'][number]
  | Legacy_V0_6_2_AdminSchemaSpecificationWithMigrations['componentTypes'][number];

/** In version after 0.4.7:
 * - valueTypes was renamed to componentTypes
 * - field type ValueItem was renamed to Component
 * - field spec validations valueTypes were renamed to componentTypes
 * - migration actions valueType selector was renamed to componentType
 */
interface Legacy_V0_4_7_AdminSchemaSpecificationWithMigrations
  extends Omit<
    AdminSchemaSpecificationWithMigrations,
    'entityTypes' | 'componentTypes' | 'migrations'
  > {
  entityTypes: (Omit<AdminEntityTypeSpecification, 'fields'> & {
    fields: Legacy_V0_4_7_AdminFieldSpecification[];
  })[];
  valueTypes: (Omit<AdminComponentTypeSpecification, 'fields'> & {
    fields: Legacy_V0_4_7_AdminFieldSpecification[];
  })[];
  migrations: (Omit<AdminSchemaVersionMigration, 'actions'> & {
    actions: Legacy_v0_4_7_AdminSchemaMigrationAction[];
  })[];
}

type Legacy_V0_4_7_AdminFieldSpecification<
  T extends AdminFieldSpecification = AdminFieldSpecification,
> = T extends ComponentFieldSpecification
  ? Omit<AdminFieldSpecification<ComponentFieldSpecification>, 'type' | 'componentTypes'> & {
      type: 'ValueItem';
      valueTypes: string[];
    }
  : T extends RichTextFieldSpecification
    ? Omit<AdminFieldSpecification<RichTextFieldSpecification>, 'componentTypes'> & {
        valueTypes: string[];
      }
    : T;

type Legacy_v0_4_7_AdminSchemaMigrationAction<
  T extends AdminSchemaMigrationAction = AdminSchemaMigrationAction,
> = T extends {
  componentType: string;
}
  ? Omit<T, 'componentType'> & { valueType: string }
  : T;

/** In version after 0.6.2:
 * - Entity field type was renamed to Reference
 */
interface Legacy_V0_6_2_AdminSchemaSpecificationWithMigrations
  extends Omit<AdminSchemaSpecificationWithMigrations, 'entityTypes' | 'componentTypes'> {
  entityTypes: (Omit<AdminEntityTypeSpecification, 'fields'> & {
    fields: Legacy_V0_6_2_AdminFieldSpecification[];
  })[];
  componentTypes: (Omit<AdminComponentTypeSpecification, 'fields'> & {
    fields: Legacy_V0_6_2_AdminFieldSpecification[];
  })[];
}

type Legacy_V0_6_2_AdminFieldSpecification<
  T extends AdminFieldSpecification = AdminFieldSpecification,
> = T extends ReferenceFieldSpecification
  ? Omit<AdminFieldSpecification<ReferenceFieldSpecification>, 'type'> & {
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
