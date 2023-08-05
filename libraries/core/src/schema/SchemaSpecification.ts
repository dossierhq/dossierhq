import type { LooseAutocomplete } from '../TypeUtils.js';
import type { EntityReference, Location, RichText, ValueItem } from '../Types.js';
import { RichTextNodeType } from '../Types.js';

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
  richTextNodes: LooseAutocomplete<RichTextNodeType>[];
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
  schemaKind: 'published';
  version: number;
  entityTypes: PublishedEntityTypeSpecification[];
  valueTypes: PublishedValueTypeSpecification[];
  patterns: SchemaPatternSpecification[];
  indexes: SchemaIndexSpecification[];
}

export interface AdminSchemaSpecification {
  schemaKind: 'admin';
  version: number;
  entityTypes: AdminEntityTypeSpecification[];
  valueTypes: AdminValueTypeSpecification[];
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
  | { action: 'renameType'; valueType: string; newName: string }
  | { action: 'renameField'; entityType: string; field: string; newName: string }
  | { action: 'renameField'; valueType: string; field: string; newName: string }
  | { action: 'deleteType'; entityType: string }
  | { action: 'deleteType'; valueType: string }
  | { action: 'deleteField'; entityType: string; field: string }
  | { action: 'deleteField'; valueType: string; field: string };

export type AdminSchemaTransientMigrationAction =
  | { action: 'renameIndex'; index: string; newName: string }
  | { action: 'deleteIndex'; index: string };

export interface AdminSchemaSpecificationUpdate {
  version?: number;
  entityTypes?: AdminEntityTypeSpecificationUpdate[];
  valueTypes?: AdminValueTypeSpecificationUpdate[];
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

export const REQUIRED_RICH_TEXT_NODES = [
  RichTextNodeType.root,
  RichTextNodeType.paragraph,
  RichTextNodeType.text,
  RichTextNodeType.linebreak,
  RichTextNodeType.tab,
];

export const GROUPED_RICH_TEXT_NODE_TYPES: RichTextNodeType[][] = [
  [RichTextNodeType.list, RichTextNodeType.listitem],
  [RichTextNodeType.code, RichTextNodeType['code-highlight']],
];
