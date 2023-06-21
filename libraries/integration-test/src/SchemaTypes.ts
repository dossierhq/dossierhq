import type {
  AdminClient,
  AdminEntity,
  AdminExceptionClient,
  EntityReference,
  Location,
  PublishedClient,
  PublishedEntity,
  PublishedExceptionClient,
  RichText,
  ValueItem,
} from '@dossierhq/core';

export type AppAdminClient = AdminClient<
  AppAdminEntity,
  AppAdminUniqueIndexes,
  AppAdminExceptionClient
>;

export type AppAdminExceptionClient = AdminExceptionClient<AppAdminEntity, AppAdminUniqueIndexes>;

export type AppAdminUniqueIndexes = 'genericUnique' | 'stringsUnique';

export type AppAdminEntity =
  | AdminChangeValidations
  | AdminLocations
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
}

export type AdminChangeValidations = AdminEntity<
  'ChangeValidations',
  AdminChangeValidationsFields,
  string
>;

export function isAdminChangeValidations(
  entity: AdminEntity<string, object>
): entity is AdminChangeValidations {
  return entity.info.type === 'ChangeValidations';
}

export function assertIsAdminChangeValidations(
  entity: AdminEntity<string, object>
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
  entity: AdminEntity<string, object>
): asserts entity is AdminLocations {
  if (entity.info.type !== 'Locations') {
    throw new Error('Expected info.type = Locations (but was ' + entity.info.type + ')');
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
  entity: AdminEntity<string, object>
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
  entity: AdminEntity<string, object>
): asserts entity is AdminReferences {
  if (entity.info.type !== 'References') {
    throw new Error('Expected info.type = References (but was ' + entity.info.type + ')');
  }
}

export interface AdminRichTextsFields {
  richText: RichText | null;
  richTextList: RichText[] | null;
  richTextOnlyParagraphAndText: RichText | null;
  richTextLimitedTypes: RichText | null;
}

export type AdminRichTexts = AdminEntity<'RichTexts', AdminRichTextsFields, string>;

export function isAdminRichTexts(entity: AdminEntity<string, object>): entity is AdminRichTexts {
  return entity.info.type === 'RichTexts';
}

export function assertIsAdminRichTexts(
  entity: AdminEntity<string, object>
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
  valuesList: Array<'bar' | 'baz' | 'foo'> | null;
  unique: string | null;
  uniqueAdminOnly: string | null;
  uniqueGenericIndex: string | null;
}

export type AdminStrings = AdminEntity<'Strings', AdminStringsFields, string>;

export function isAdminStrings(entity: AdminEntity<string, object>): entity is AdminStrings {
  return entity.info.type === 'Strings';
}

export function assertIsAdminStrings(
  entity: AdminEntity<string, object>
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
  entity: AdminEntity<string, object>
): entity is AdminSubjectOnly {
  return entity.info.type === 'SubjectOnly';
}

export function assertIsAdminSubjectOnly(
  entity: AdminEntity<string, object>
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
  entity: AdminEntity<string, object>
): asserts entity is AdminTitleOnly {
  if (entity.info.type !== 'TitleOnly') {
    throw new Error('Expected info.type = TitleOnly (but was ' + entity.info.type + ')');
  }
}

export interface AdminValueItemsFields {
  any: AppAdminValueItem | null;
  anyAdminOnly: AppAdminValueItem | null;
}

export type AdminValueItems = AdminEntity<'ValueItems', AdminValueItemsFields, string>;

export function isAdminValueItems(entity: AdminEntity<string, object>): entity is AdminValueItems {
  return entity.info.type === 'ValueItems';
}

export function assertIsAdminValueItems(
  entity: AdminEntity<string, object>
): asserts entity is AdminValueItems {
  if (entity.info.type !== 'ValueItems') {
    throw new Error('Expected info.type = ValueItems (but was ' + entity.info.type + ')');
  }
}

export type AppAdminValueItem =
  | AdminAdminOnlyValue
  | AdminChangeValidationsValueItem
  | AdminLocationsValue
  | AdminReferencesValue;

export type AdminAdminOnlyValueFields = Record<never, never>;

export type AdminAdminOnlyValue = ValueItem<'AdminOnlyValue', AdminAdminOnlyValueFields>;

export function isAdminAdminOnlyValue(
  valueItem: ValueItem<string, object> | AdminAdminOnlyValue
): valueItem is AdminAdminOnlyValue {
  return valueItem.type === 'AdminOnlyValue';
}

export function assertIsAdminAdminOnlyValue(
  valueItem: ValueItem<string, object> | AdminAdminOnlyValue
): asserts valueItem is AdminAdminOnlyValue {
  if (valueItem.type !== 'AdminOnlyValue') {
    throw new Error('Expected type = AdminOnlyValue (but was ' + valueItem.type + ')');
  }
}

export interface AdminChangeValidationsValueItemFields {
  matchPattern: string | null;
}

export type AdminChangeValidationsValueItem = ValueItem<
  'ChangeValidationsValueItem',
  AdminChangeValidationsValueItemFields
>;

export function isAdminChangeValidationsValueItem(
  valueItem: ValueItem<string, object> | AdminChangeValidationsValueItem
): valueItem is AdminChangeValidationsValueItem {
  return valueItem.type === 'ChangeValidationsValueItem';
}

export function assertIsAdminChangeValidationsValueItem(
  valueItem: ValueItem<string, object> | AdminChangeValidationsValueItem
): asserts valueItem is AdminChangeValidationsValueItem {
  if (valueItem.type !== 'ChangeValidationsValueItem') {
    throw new Error('Expected type = ChangeValidationsValueItem (but was ' + valueItem.type + ')');
  }
}

export interface AdminLocationsValueFields {
  location: Location | null;
  locationAdminOnly: Location | null;
}

export type AdminLocationsValue = ValueItem<'LocationsValue', AdminLocationsValueFields>;

export function isAdminLocationsValue(
  valueItem: ValueItem<string, object> | AdminLocationsValue
): valueItem is AdminLocationsValue {
  return valueItem.type === 'LocationsValue';
}

export function assertIsAdminLocationsValue(
  valueItem: ValueItem<string, object> | AdminLocationsValue
): asserts valueItem is AdminLocationsValue {
  if (valueItem.type !== 'LocationsValue') {
    throw new Error('Expected type = LocationsValue (but was ' + valueItem.type + ')');
  }
}

export interface AdminReferencesValueFields {
  reference: EntityReference | null;
}

export type AdminReferencesValue = ValueItem<'ReferencesValue', AdminReferencesValueFields>;

export function isAdminReferencesValue(
  valueItem: ValueItem<string, object> | AdminReferencesValue
): valueItem is AdminReferencesValue {
  return valueItem.type === 'ReferencesValue';
}

export function assertIsAdminReferencesValue(
  valueItem: ValueItem<string, object> | AdminReferencesValue
): asserts valueItem is AdminReferencesValue {
  if (valueItem.type !== 'ReferencesValue') {
    throw new Error('Expected type = ReferencesValue (but was ' + valueItem.type + ')');
  }
}

export type AppPublishedClient = PublishedClient<
  AppPublishedEntity,
  AppPublishedUniqueIndexes,
  AppPublishedExceptionClient
>;

export type AppPublishedExceptionClient = PublishedExceptionClient<
  AppPublishedEntity,
  AppPublishedUniqueIndexes
>;

export type AppPublishedUniqueIndexes = 'genericUnique' | 'stringsUnique';

export type AppPublishedEntity =
  | PublishedChangeValidations
  | PublishedLocations
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
}

export type PublishedChangeValidations = PublishedEntity<
  'ChangeValidations',
  PublishedChangeValidationsFields,
  string
>;

export function isPublishedChangeValidations(
  entity: PublishedEntity<string, object>
): entity is PublishedChangeValidations {
  return entity.info.type === 'ChangeValidations';
}

export function assertIsPublishedChangeValidations(
  entity: PublishedEntity<string, object>
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
  entity: PublishedEntity<string, object>
): entity is PublishedLocations {
  return entity.info.type === 'Locations';
}

export function assertIsPublishedLocations(
  entity: PublishedEntity<string, object>
): asserts entity is PublishedLocations {
  if (entity.info.type !== 'Locations') {
    throw new Error('Expected info.type = Locations (but was ' + entity.info.type + ')');
  }
}

export interface PublishedReadOnlyFields {
  message: string;
}

export type PublishedReadOnly = PublishedEntity<'ReadOnly', PublishedReadOnlyFields, string>;

export function isPublishedReadOnly(
  entity: PublishedEntity<string, object>
): entity is PublishedReadOnly {
  return entity.info.type === 'ReadOnly';
}

export function assertIsPublishedReadOnly(
  entity: PublishedEntity<string, object>
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
  entity: PublishedEntity<string, object>
): entity is PublishedReferences {
  return entity.info.type === 'References';
}

export function assertIsPublishedReferences(
  entity: PublishedEntity<string, object>
): asserts entity is PublishedReferences {
  if (entity.info.type !== 'References') {
    throw new Error('Expected info.type = References (but was ' + entity.info.type + ')');
  }
}

export interface PublishedRichTextsFields {
  richText: RichText | null;
  richTextList: RichText[] | null;
  richTextOnlyParagraphAndText: RichText | null;
  richTextLimitedTypes: RichText | null;
}

export type PublishedRichTexts = PublishedEntity<'RichTexts', PublishedRichTextsFields, string>;

export function isPublishedRichTexts(
  entity: PublishedEntity<string, object>
): entity is PublishedRichTexts {
  return entity.info.type === 'RichTexts';
}

export function assertIsPublishedRichTexts(
  entity: PublishedEntity<string, object>
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
  valuesList: Array<'bar' | 'baz' | 'foo'> | null;
  unique: string | null;
  uniqueGenericIndex: string | null;
}

export type PublishedStrings = PublishedEntity<'Strings', PublishedStringsFields, string>;

export function isPublishedStrings(
  entity: PublishedEntity<string, object>
): entity is PublishedStrings {
  return entity.info.type === 'Strings';
}

export function assertIsPublishedStrings(
  entity: PublishedEntity<string, object>
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
  entity: PublishedEntity<string, object>
): entity is PublishedSubjectOnly {
  return entity.info.type === 'SubjectOnly';
}

export function assertIsPublishedSubjectOnly(
  entity: PublishedEntity<string, object>
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
  entity: PublishedEntity<string, object>
): entity is PublishedTitleOnly {
  return entity.info.type === 'TitleOnly';
}

export function assertIsPublishedTitleOnly(
  entity: PublishedEntity<string, object>
): asserts entity is PublishedTitleOnly {
  if (entity.info.type !== 'TitleOnly') {
    throw new Error('Expected info.type = TitleOnly (but was ' + entity.info.type + ')');
  }
}

export interface PublishedValueItemsFields {
  any: AppPublishedValueItem | null;
}

export type PublishedValueItems = PublishedEntity<'ValueItems', PublishedValueItemsFields, string>;

export function isPublishedValueItems(
  entity: PublishedEntity<string, object>
): entity is PublishedValueItems {
  return entity.info.type === 'ValueItems';
}

export function assertIsPublishedValueItems(
  entity: PublishedEntity<string, object>
): asserts entity is PublishedValueItems {
  if (entity.info.type !== 'ValueItems') {
    throw new Error('Expected info.type = ValueItems (but was ' + entity.info.type + ')');
  }
}

export type AppPublishedValueItem =
  | PublishedChangeValidationsValueItem
  | PublishedLocationsValue
  | PublishedReferencesValue;

export interface PublishedChangeValidationsValueItemFields {
  matchPattern: string | null;
}

export type PublishedChangeValidationsValueItem = ValueItem<
  'ChangeValidationsValueItem',
  PublishedChangeValidationsValueItemFields
>;

export function isPublishedChangeValidationsValueItem(
  valueItem: ValueItem<string, object> | PublishedChangeValidationsValueItem
): valueItem is PublishedChangeValidationsValueItem {
  return valueItem.type === 'ChangeValidationsValueItem';
}

export function assertIsPublishedChangeValidationsValueItem(
  valueItem: ValueItem<string, object> | PublishedChangeValidationsValueItem
): asserts valueItem is PublishedChangeValidationsValueItem {
  if (valueItem.type !== 'ChangeValidationsValueItem') {
    throw new Error('Expected type = ChangeValidationsValueItem (but was ' + valueItem.type + ')');
  }
}

export interface PublishedLocationsValueFields {
  location: Location | null;
}

export type PublishedLocationsValue = ValueItem<'LocationsValue', PublishedLocationsValueFields>;

export function isPublishedLocationsValue(
  valueItem: ValueItem<string, object> | PublishedLocationsValue
): valueItem is PublishedLocationsValue {
  return valueItem.type === 'LocationsValue';
}

export function assertIsPublishedLocationsValue(
  valueItem: ValueItem<string, object> | PublishedLocationsValue
): asserts valueItem is PublishedLocationsValue {
  if (valueItem.type !== 'LocationsValue') {
    throw new Error('Expected type = LocationsValue (but was ' + valueItem.type + ')');
  }
}

export interface PublishedReferencesValueFields {
  reference: EntityReference | null;
}

export type PublishedReferencesValue = ValueItem<'ReferencesValue', PublishedReferencesValueFields>;

export function isPublishedReferencesValue(
  valueItem: ValueItem<string, object> | PublishedReferencesValue
): valueItem is PublishedReferencesValue {
  return valueItem.type === 'ReferencesValue';
}

export function assertIsPublishedReferencesValue(
  valueItem: ValueItem<string, object> | PublishedReferencesValue
): asserts valueItem is PublishedReferencesValue {
  if (valueItem.type !== 'ReferencesValue') {
    throw new Error('Expected type = ReferencesValue (but was ' + valueItem.type + ')');
  }
}
