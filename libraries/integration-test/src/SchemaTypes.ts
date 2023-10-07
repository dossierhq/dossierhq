import type {
  AdminClient,
  AdminEntity,
  AdminExceptionClient,
  Component,
  EntityReference,
  Location,
  PublishedClient,
  PublishedEntity,
  PublishedExceptionClient,
  RichText,
} from '@dossierhq/core';

export type AppAdminClient = AdminClient<
  AppAdminEntity,
  AppAdminComponent,
  AppAdminUniqueIndexes,
  AppAdminExceptionClient
>;

export type AppAdminExceptionClient = AdminExceptionClient<
  AppAdminEntity,
  AppAdminComponent,
  AppAdminUniqueIndexes
>;

export type AppAdminUniqueIndexes = 'genericUnique' | 'stringsUnique';

export type AppAdminEntity =
  | AdminChangeValidations
  | AdminLocations
  | AdminMigrationEntity
  | AdminReadOnly
  | AdminReferences
  | AdminRichTexts
  | AdminStrings
  | AdminSubjectOnly
  | AdminTitleOnly
  | AdminValueItems;

export interface AdminChangeValidationsFields {
  required: string | null;
  matchPattern: string | null;
  richText: RichText | null;
  valueItem: AppAdminComponent | null;
  valueItemList: AppAdminComponent[] | null;
}

export type AdminChangeValidations = AdminEntity<
  'ChangeValidations',
  AdminChangeValidationsFields,
  string
>;

export function isAdminChangeValidations(
  entity: AdminEntity<string, object>,
): entity is AdminChangeValidations {
  return entity.info.type === 'ChangeValidations';
}

export function assertIsAdminChangeValidations(
  entity: AdminEntity<string, object>,
): asserts entity is AdminChangeValidations {
  if (entity.info.type !== 'ChangeValidations') {
    throw new Error('Expected info.type = ChangeValidations (but was ' + entity.info.type + ')');
  }
}

export interface AdminLocationsFields {
  location: Location | null;
  locationList: Location[] | null;
  locationAdminOnly: Location | null;
}

export type AdminLocations = AdminEntity<'Locations', AdminLocationsFields, string>;

export function isAdminLocations(entity: AdminEntity<string, object>): entity is AdminLocations {
  return entity.info.type === 'Locations';
}

export function assertIsAdminLocations(
  entity: AdminEntity<string, object>,
): asserts entity is AdminLocations {
  if (entity.info.type !== 'Locations') {
    throw new Error('Expected info.type = Locations (but was ' + entity.info.type + ')');
  }
}

export type AdminMigrationEntityFields = Record<never, never>;

export type AdminMigrationEntity = AdminEntity<
  'MigrationEntity',
  AdminMigrationEntityFields,
  string
>;

export function isAdminMigrationEntity(
  entity: AdminEntity<string, object>,
): entity is AdminMigrationEntity {
  return entity.info.type === 'MigrationEntity';
}

export function assertIsAdminMigrationEntity(
  entity: AdminEntity<string, object>,
): asserts entity is AdminMigrationEntity {
  if (entity.info.type !== 'MigrationEntity') {
    throw new Error('Expected info.type = MigrationEntity (but was ' + entity.info.type + ')');
  }
}

export interface AdminReadOnlyFields {
  message: string | null;
}

export type AdminReadOnly = AdminEntity<'ReadOnly', AdminReadOnlyFields, string>;

export function isAdminReadOnly(entity: AdminEntity<string, object>): entity is AdminReadOnly {
  return entity.info.type === 'ReadOnly';
}

export function assertIsAdminReadOnly(
  entity: AdminEntity<string, object>,
): asserts entity is AdminReadOnly {
  if (entity.info.type !== 'ReadOnly') {
    throw new Error('Expected info.type = ReadOnly (but was ' + entity.info.type + ')');
  }
}

export interface AdminReferencesFields {
  any: EntityReference | null;
  anyList: EntityReference[] | null;
  anyAdminOnly: EntityReference | null;
  titleOnly: EntityReference | null;
}

export type AdminReferences = AdminEntity<'References', AdminReferencesFields, string>;

export function isAdminReferences(entity: AdminEntity<string, object>): entity is AdminReferences {
  return entity.info.type === 'References';
}

export function assertIsAdminReferences(
  entity: AdminEntity<string, object>,
): asserts entity is AdminReferences {
  if (entity.info.type !== 'References') {
    throw new Error('Expected info.type = References (but was ' + entity.info.type + ')');
  }
}

export interface AdminRichTextsFields {
  richText: RichText | null;
  richTextList: RichText[] | null;
  richTextMinimal: RichText | null;
  richTextLimitedTypes: RichText | null;
}

export type AdminRichTexts = AdminEntity<'RichTexts', AdminRichTextsFields, string>;

export function isAdminRichTexts(entity: AdminEntity<string, object>): entity is AdminRichTexts {
  return entity.info.type === 'RichTexts';
}

export function assertIsAdminRichTexts(
  entity: AdminEntity<string, object>,
): asserts entity is AdminRichTexts {
  if (entity.info.type !== 'RichTexts') {
    throw new Error('Expected info.type = RichTexts (but was ' + entity.info.type + ')');
  }
}

export interface AdminStringsFields {
  multiline: string | null;
  stringAdminOnly: string | null;
  pattern: string | null;
  patternList: string[] | null;
  values: 'bar' | 'baz' | 'foo' | null;
  valuesList: ('bar' | 'baz' | 'foo')[] | null;
  unique: string | null;
  uniqueAdminOnly: string | null;
  uniqueGenericIndex: string | null;
}

export type AdminStrings = AdminEntity<'Strings', AdminStringsFields, string>;

export function isAdminStrings(entity: AdminEntity<string, object>): entity is AdminStrings {
  return entity.info.type === 'Strings';
}

export function assertIsAdminStrings(
  entity: AdminEntity<string, object>,
): asserts entity is AdminStrings {
  if (entity.info.type !== 'Strings') {
    throw new Error('Expected info.type = Strings (but was ' + entity.info.type + ')');
  }
}

export interface AdminSubjectOnlyFields {
  message: string | null;
}

export type AdminSubjectOnly = AdminEntity<'SubjectOnly', AdminSubjectOnlyFields, string>;

export function isAdminSubjectOnly(
  entity: AdminEntity<string, object>,
): entity is AdminSubjectOnly {
  return entity.info.type === 'SubjectOnly';
}

export function assertIsAdminSubjectOnly(
  entity: AdminEntity<string, object>,
): asserts entity is AdminSubjectOnly {
  if (entity.info.type !== 'SubjectOnly') {
    throw new Error('Expected info.type = SubjectOnly (but was ' + entity.info.type + ')');
  }
}

export interface AdminTitleOnlyFields {
  title: string | null;
}

export type AdminTitleOnly = AdminEntity<'TitleOnly', AdminTitleOnlyFields, string>;

export function isAdminTitleOnly(entity: AdminEntity<string, object>): entity is AdminTitleOnly {
  return entity.info.type === 'TitleOnly';
}

export function assertIsAdminTitleOnly(
  entity: AdminEntity<string, object>,
): asserts entity is AdminTitleOnly {
  if (entity.info.type !== 'TitleOnly') {
    throw new Error('Expected info.type = TitleOnly (but was ' + entity.info.type + ')');
  }
}

export interface AdminValueItemsFields {
  any: AppAdminComponent | null;
  anyAdminOnly: AppAdminComponent | null;
}

export type AdminValueItems = AdminEntity<'ValueItems', AdminValueItemsFields, string>;

export function isAdminValueItems(entity: AdminEntity<string, object>): entity is AdminValueItems {
  return entity.info.type === 'ValueItems';
}

export function assertIsAdminValueItems(
  entity: AdminEntity<string, object>,
): asserts entity is AdminValueItems {
  if (entity.info.type !== 'ValueItems') {
    throw new Error('Expected info.type = ValueItems (but was ' + entity.info.type + ')');
  }
}

export type AppAdminComponent =
  | AdminAdminOnlyValue
  | AdminChangeValidationsValueItem
  | AdminLocationsValue
  | AdminMigrationValueItem
  | AdminReferencesValue;

export type AdminAdminOnlyValueFields = Record<never, never>;

export type AdminAdminOnlyValue = Component<'AdminOnlyValue', AdminAdminOnlyValueFields>;

export function isAdminAdminOnlyValue(
  component: Component<string, object> | AdminAdminOnlyValue,
): component is AdminAdminOnlyValue {
  return component.type === 'AdminOnlyValue';
}

export function assertIsAdminAdminOnlyValue(
  component: Component<string, object> | AdminAdminOnlyValue,
): asserts component is AdminAdminOnlyValue {
  if (component.type !== 'AdminOnlyValue') {
    throw new Error('Expected type = AdminOnlyValue (but was ' + component.type + ')');
  }
}

export interface AdminChangeValidationsValueItemFields {
  matchPattern: string | null;
}

export type AdminChangeValidationsValueItem = Component<
  'ChangeValidationsValueItem',
  AdminChangeValidationsValueItemFields
>;

export function isAdminChangeValidationsValueItem(
  component: Component<string, object> | AdminChangeValidationsValueItem,
): component is AdminChangeValidationsValueItem {
  return component.type === 'ChangeValidationsValueItem';
}

export function assertIsAdminChangeValidationsValueItem(
  component: Component<string, object> | AdminChangeValidationsValueItem,
): asserts component is AdminChangeValidationsValueItem {
  if (component.type !== 'ChangeValidationsValueItem') {
    throw new Error('Expected type = ChangeValidationsValueItem (but was ' + component.type + ')');
  }
}

export interface AdminLocationsValueFields {
  location: Location | null;
  locationAdminOnly: Location | null;
}

export type AdminLocationsValue = Component<'LocationsValue', AdminLocationsValueFields>;

export function isAdminLocationsValue(
  component: Component<string, object> | AdminLocationsValue,
): component is AdminLocationsValue {
  return component.type === 'LocationsValue';
}

export function assertIsAdminLocationsValue(
  component: Component<string, object> | AdminLocationsValue,
): asserts component is AdminLocationsValue {
  if (component.type !== 'LocationsValue') {
    throw new Error('Expected type = LocationsValue (but was ' + component.type + ')');
  }
}

export type AdminMigrationValueItemFields = Record<never, never>;

export type AdminMigrationValueItem = Component<
  'MigrationValueItem',
  AdminMigrationValueItemFields
>;

export function isAdminMigrationValueItem(
  component: Component<string, object> | AdminMigrationValueItem,
): component is AdminMigrationValueItem {
  return component.type === 'MigrationValueItem';
}

export function assertIsAdminMigrationValueItem(
  component: Component<string, object> | AdminMigrationValueItem,
): asserts component is AdminMigrationValueItem {
  if (component.type !== 'MigrationValueItem') {
    throw new Error('Expected type = MigrationValueItem (but was ' + component.type + ')');
  }
}

export interface AdminReferencesValueFields {
  reference: EntityReference | null;
}

export type AdminReferencesValue = Component<'ReferencesValue', AdminReferencesValueFields>;

export function isAdminReferencesValue(
  component: Component<string, object> | AdminReferencesValue,
): component is AdminReferencesValue {
  return component.type === 'ReferencesValue';
}

export function assertIsAdminReferencesValue(
  component: Component<string, object> | AdminReferencesValue,
): asserts component is AdminReferencesValue {
  if (component.type !== 'ReferencesValue') {
    throw new Error('Expected type = ReferencesValue (but was ' + component.type + ')');
  }
}

export type AppPublishedClient = PublishedClient<
  AppPublishedEntity,
  AppPublishedComponent,
  AppPublishedUniqueIndexes,
  AppPublishedExceptionClient
>;

export type AppPublishedExceptionClient = PublishedExceptionClient<
  AppPublishedEntity,
  AppPublishedComponent,
  AppPublishedUniqueIndexes
>;

export type AppPublishedUniqueIndexes = 'genericUnique' | 'stringsUnique';

export type AppPublishedEntity =
  | PublishedChangeValidations
  | PublishedLocations
  | PublishedMigrationEntity
  | PublishedReadOnly
  | PublishedReferences
  | PublishedRichTexts
  | PublishedStrings
  | PublishedSubjectOnly
  | PublishedTitleOnly
  | PublishedValueItems;

export interface PublishedChangeValidationsFields {
  required: string;
  matchPattern: string | null;
  richText: RichText | null;
  valueItem: AppPublishedComponent | null;
  valueItemList: AppPublishedComponent[] | null;
}

export type PublishedChangeValidations = PublishedEntity<
  'ChangeValidations',
  PublishedChangeValidationsFields,
  string
>;

export function isPublishedChangeValidations(
  entity: PublishedEntity<string, object>,
): entity is PublishedChangeValidations {
  return entity.info.type === 'ChangeValidations';
}

export function assertIsPublishedChangeValidations(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedChangeValidations {
  if (entity.info.type !== 'ChangeValidations') {
    throw new Error('Expected info.type = ChangeValidations (but was ' + entity.info.type + ')');
  }
}

export interface PublishedLocationsFields {
  location: Location | null;
  locationList: Location[] | null;
}

export type PublishedLocations = PublishedEntity<'Locations', PublishedLocationsFields, string>;

export function isPublishedLocations(
  entity: PublishedEntity<string, object>,
): entity is PublishedLocations {
  return entity.info.type === 'Locations';
}

export function assertIsPublishedLocations(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedLocations {
  if (entity.info.type !== 'Locations') {
    throw new Error('Expected info.type = Locations (but was ' + entity.info.type + ')');
  }
}

export type PublishedMigrationEntityFields = Record<never, never>;

export type PublishedMigrationEntity = PublishedEntity<
  'MigrationEntity',
  PublishedMigrationEntityFields,
  string
>;

export function isPublishedMigrationEntity(
  entity: PublishedEntity<string, object>,
): entity is PublishedMigrationEntity {
  return entity.info.type === 'MigrationEntity';
}

export function assertIsPublishedMigrationEntity(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedMigrationEntity {
  if (entity.info.type !== 'MigrationEntity') {
    throw new Error('Expected info.type = MigrationEntity (but was ' + entity.info.type + ')');
  }
}

export interface PublishedReadOnlyFields {
  message: string;
}

export type PublishedReadOnly = PublishedEntity<'ReadOnly', PublishedReadOnlyFields, string>;

export function isPublishedReadOnly(
  entity: PublishedEntity<string, object>,
): entity is PublishedReadOnly {
  return entity.info.type === 'ReadOnly';
}

export function assertIsPublishedReadOnly(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedReadOnly {
  if (entity.info.type !== 'ReadOnly') {
    throw new Error('Expected info.type = ReadOnly (but was ' + entity.info.type + ')');
  }
}

export interface PublishedReferencesFields {
  any: EntityReference | null;
  anyList: EntityReference[] | null;
  titleOnly: EntityReference | null;
}

export type PublishedReferences = PublishedEntity<'References', PublishedReferencesFields, string>;

export function isPublishedReferences(
  entity: PublishedEntity<string, object>,
): entity is PublishedReferences {
  return entity.info.type === 'References';
}

export function assertIsPublishedReferences(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedReferences {
  if (entity.info.type !== 'References') {
    throw new Error('Expected info.type = References (but was ' + entity.info.type + ')');
  }
}

export interface PublishedRichTextsFields {
  richText: RichText | null;
  richTextList: RichText[] | null;
  richTextMinimal: RichText | null;
  richTextLimitedTypes: RichText | null;
}

export type PublishedRichTexts = PublishedEntity<'RichTexts', PublishedRichTextsFields, string>;

export function isPublishedRichTexts(
  entity: PublishedEntity<string, object>,
): entity is PublishedRichTexts {
  return entity.info.type === 'RichTexts';
}

export function assertIsPublishedRichTexts(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedRichTexts {
  if (entity.info.type !== 'RichTexts') {
    throw new Error('Expected info.type = RichTexts (but was ' + entity.info.type + ')');
  }
}

export interface PublishedStringsFields {
  multiline: string | null;
  pattern: string | null;
  patternList: string[] | null;
  values: 'bar' | 'baz' | 'foo' | null;
  valuesList: ('bar' | 'baz' | 'foo')[] | null;
  unique: string | null;
  uniqueGenericIndex: string | null;
}

export type PublishedStrings = PublishedEntity<'Strings', PublishedStringsFields, string>;

export function isPublishedStrings(
  entity: PublishedEntity<string, object>,
): entity is PublishedStrings {
  return entity.info.type === 'Strings';
}

export function assertIsPublishedStrings(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedStrings {
  if (entity.info.type !== 'Strings') {
    throw new Error('Expected info.type = Strings (but was ' + entity.info.type + ')');
  }
}

export interface PublishedSubjectOnlyFields {
  message: string;
}

export type PublishedSubjectOnly = PublishedEntity<
  'SubjectOnly',
  PublishedSubjectOnlyFields,
  string
>;

export function isPublishedSubjectOnly(
  entity: PublishedEntity<string, object>,
): entity is PublishedSubjectOnly {
  return entity.info.type === 'SubjectOnly';
}

export function assertIsPublishedSubjectOnly(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedSubjectOnly {
  if (entity.info.type !== 'SubjectOnly') {
    throw new Error('Expected info.type = SubjectOnly (but was ' + entity.info.type + ')');
  }
}

export interface PublishedTitleOnlyFields {
  title: string;
}

export type PublishedTitleOnly = PublishedEntity<'TitleOnly', PublishedTitleOnlyFields, string>;

export function isPublishedTitleOnly(
  entity: PublishedEntity<string, object>,
): entity is PublishedTitleOnly {
  return entity.info.type === 'TitleOnly';
}

export function assertIsPublishedTitleOnly(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedTitleOnly {
  if (entity.info.type !== 'TitleOnly') {
    throw new Error('Expected info.type = TitleOnly (but was ' + entity.info.type + ')');
  }
}

export interface PublishedValueItemsFields {
  any: AppPublishedComponent | null;
}

export type PublishedValueItems = PublishedEntity<'ValueItems', PublishedValueItemsFields, string>;

export function isPublishedValueItems(
  entity: PublishedEntity<string, object>,
): entity is PublishedValueItems {
  return entity.info.type === 'ValueItems';
}

export function assertIsPublishedValueItems(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedValueItems {
  if (entity.info.type !== 'ValueItems') {
    throw new Error('Expected info.type = ValueItems (but was ' + entity.info.type + ')');
  }
}

export type AppPublishedComponent =
  | PublishedChangeValidationsValueItem
  | PublishedLocationsValue
  | PublishedMigrationValueItem
  | PublishedReferencesValue;

export interface PublishedChangeValidationsValueItemFields {
  matchPattern: string | null;
}

export type PublishedChangeValidationsValueItem = Component<
  'ChangeValidationsValueItem',
  PublishedChangeValidationsValueItemFields
>;

export function isPublishedChangeValidationsValueItem(
  component: Component<string, object> | PublishedChangeValidationsValueItem,
): component is PublishedChangeValidationsValueItem {
  return component.type === 'ChangeValidationsValueItem';
}

export function assertIsPublishedChangeValidationsValueItem(
  component: Component<string, object> | PublishedChangeValidationsValueItem,
): asserts component is PublishedChangeValidationsValueItem {
  if (component.type !== 'ChangeValidationsValueItem') {
    throw new Error('Expected type = ChangeValidationsValueItem (but was ' + component.type + ')');
  }
}

export interface PublishedLocationsValueFields {
  location: Location | null;
}

export type PublishedLocationsValue = Component<'LocationsValue', PublishedLocationsValueFields>;

export function isPublishedLocationsValue(
  component: Component<string, object> | PublishedLocationsValue,
): component is PublishedLocationsValue {
  return component.type === 'LocationsValue';
}

export function assertIsPublishedLocationsValue(
  component: Component<string, object> | PublishedLocationsValue,
): asserts component is PublishedLocationsValue {
  if (component.type !== 'LocationsValue') {
    throw new Error('Expected type = LocationsValue (but was ' + component.type + ')');
  }
}

export type PublishedMigrationValueItemFields = Record<never, never>;

export type PublishedMigrationValueItem = Component<
  'MigrationValueItem',
  PublishedMigrationValueItemFields
>;

export function isPublishedMigrationValueItem(
  component: Component<string, object> | PublishedMigrationValueItem,
): component is PublishedMigrationValueItem {
  return component.type === 'MigrationValueItem';
}

export function assertIsPublishedMigrationValueItem(
  component: Component<string, object> | PublishedMigrationValueItem,
): asserts component is PublishedMigrationValueItem {
  if (component.type !== 'MigrationValueItem') {
    throw new Error('Expected type = MigrationValueItem (but was ' + component.type + ')');
  }
}

export interface PublishedReferencesValueFields {
  reference: EntityReference | null;
}

export type PublishedReferencesValue = Component<'ReferencesValue', PublishedReferencesValueFields>;

export function isPublishedReferencesValue(
  component: Component<string, object> | PublishedReferencesValue,
): component is PublishedReferencesValue {
  return component.type === 'ReferencesValue';
}

export function assertIsPublishedReferencesValue(
  component: Component<string, object> | PublishedReferencesValue,
): asserts component is PublishedReferencesValue {
  if (component.type !== 'ReferencesValue') {
    throw new Error('Expected type = ReferencesValue (but was ' + component.type + ')');
  }
}
