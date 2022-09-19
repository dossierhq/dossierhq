import type {
  AdminEntity,
  EntityReference,
  Location,
  PublishedEntity,
  RichText,
  ValueItem,
} from '@jonasb/datadata-core';

export interface AdminLocationsFields {
  location: Location | null;
  locationList: Array<Location> | null;
  locationAdminOnly: Location | null;
}

export type AdminLocations = AdminEntity<'Locations', AdminLocationsFields>;

export function isAdminLocations(entity: AdminEntity | AdminLocations): entity is AdminLocations {
  return entity.info.type === 'Locations';
}

export function assertIsAdminLocations(
  entity: AdminEntity | AdminLocations
): asserts entity is AdminLocations {
  if (entity.info.type !== 'Locations') {
    throw new Error('Expected info.type = Locations (but was ' + entity.info.type + ')');
  }
}

export interface AdminReadOnlyFields {
  message: string | null;
}

export type AdminReadOnly = AdminEntity<'ReadOnly', AdminReadOnlyFields>;

export function isAdminReadOnly(entity: AdminEntity | AdminReadOnly): entity is AdminReadOnly {
  return entity.info.type === 'ReadOnly';
}

export function assertIsAdminReadOnly(
  entity: AdminEntity | AdminReadOnly
): asserts entity is AdminReadOnly {
  if (entity.info.type !== 'ReadOnly') {
    throw new Error('Expected info.type = ReadOnly (but was ' + entity.info.type + ')');
  }
}

export interface AdminReferencesFields {
  any: EntityReference | null;
  anyList: Array<EntityReference> | null;
  anyAdminOnly: EntityReference | null;
  titleOnly: EntityReference | null;
}

export type AdminReferences = AdminEntity<'References', AdminReferencesFields>;

export function isAdminReferences(
  entity: AdminEntity | AdminReferences
): entity is AdminReferences {
  return entity.info.type === 'References';
}

export function assertIsAdminReferences(
  entity: AdminEntity | AdminReferences
): asserts entity is AdminReferences {
  if (entity.info.type !== 'References') {
    throw new Error('Expected info.type = References (but was ' + entity.info.type + ')');
  }
}

export interface AdminRichTextsFields {
  richText: RichText | null;
  richTextList: Array<RichText> | null;
  richTextOnlyParagraphAndText: RichText | null;
}

export type AdminRichTexts = AdminEntity<'RichTexts', AdminRichTextsFields>;

export function isAdminRichTexts(entity: AdminEntity | AdminRichTexts): entity is AdminRichTexts {
  return entity.info.type === 'RichTexts';
}

export function assertIsAdminRichTexts(
  entity: AdminEntity | AdminRichTexts
): asserts entity is AdminRichTexts {
  if (entity.info.type !== 'RichTexts') {
    throw new Error('Expected info.type = RichTexts (but was ' + entity.info.type + ')');
  }
}

export interface AdminStringsFields {
  multiline: string | null;
  stringAdminOnly: string | null;
}

export type AdminStrings = AdminEntity<'Strings', AdminStringsFields>;

export function isAdminStrings(entity: AdminEntity | AdminStrings): entity is AdminStrings {
  return entity.info.type === 'Strings';
}

export function assertIsAdminStrings(
  entity: AdminEntity | AdminStrings
): asserts entity is AdminStrings {
  if (entity.info.type !== 'Strings') {
    throw new Error('Expected info.type = Strings (but was ' + entity.info.type + ')');
  }
}

export interface AdminSubjectOnlyFields {
  message: string | null;
}

export type AdminSubjectOnly = AdminEntity<'SubjectOnly', AdminSubjectOnlyFields>;

export function isAdminSubjectOnly(
  entity: AdminEntity | AdminSubjectOnly
): entity is AdminSubjectOnly {
  return entity.info.type === 'SubjectOnly';
}

export function assertIsAdminSubjectOnly(
  entity: AdminEntity | AdminSubjectOnly
): asserts entity is AdminSubjectOnly {
  if (entity.info.type !== 'SubjectOnly') {
    throw new Error('Expected info.type = SubjectOnly (but was ' + entity.info.type + ')');
  }
}

export interface AdminTitleOnlyFields {
  title: string | null;
}

export type AdminTitleOnly = AdminEntity<'TitleOnly', AdminTitleOnlyFields>;

export function isAdminTitleOnly(entity: AdminEntity | AdminTitleOnly): entity is AdminTitleOnly {
  return entity.info.type === 'TitleOnly';
}

export function assertIsAdminTitleOnly(
  entity: AdminEntity | AdminTitleOnly
): asserts entity is AdminTitleOnly {
  if (entity.info.type !== 'TitleOnly') {
    throw new Error('Expected info.type = TitleOnly (but was ' + entity.info.type + ')');
  }
}

export interface AdminValueItemsFields {
  any: AllAdminValueItems | null;
  anyAdminOnly: AllAdminValueItems | null;
}

export type AdminValueItems = AdminEntity<'ValueItems', AdminValueItemsFields>;

export function isAdminValueItems(
  entity: AdminEntity | AdminValueItems
): entity is AdminValueItems {
  return entity.info.type === 'ValueItems';
}

export function assertIsAdminValueItems(
  entity: AdminEntity | AdminValueItems
): asserts entity is AdminValueItems {
  if (entity.info.type !== 'ValueItems') {
    throw new Error('Expected info.type = ValueItems (but was ' + entity.info.type + ')');
  }
}

export type AllAdminValueItems = AdminAdminOnlyValue | AdminLocationsValue | AdminReferencesValue;

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

export interface PublishedLocationsFields {
  location: Location | null;
  locationList: Array<Location> | null;
}

export type PublishedLocations = PublishedEntity<'Locations', PublishedLocationsFields>;

export function isPublishedLocations(
  entity: PublishedEntity | PublishedLocations
): entity is PublishedLocations {
  return entity.info.type === 'Locations';
}

export function assertIsPublishedLocations(
  entity: PublishedEntity | PublishedLocations
): asserts entity is PublishedLocations {
  if (entity.info.type !== 'Locations') {
    throw new Error('Expected info.type = Locations (but was ' + entity.info.type + ')');
  }
}

export interface PublishedReadOnlyFields {
  message: string | null;
}

export type PublishedReadOnly = PublishedEntity<'ReadOnly', PublishedReadOnlyFields>;

export function isPublishedReadOnly(
  entity: PublishedEntity | PublishedReadOnly
): entity is PublishedReadOnly {
  return entity.info.type === 'ReadOnly';
}

export function assertIsPublishedReadOnly(
  entity: PublishedEntity | PublishedReadOnly
): asserts entity is PublishedReadOnly {
  if (entity.info.type !== 'ReadOnly') {
    throw new Error('Expected info.type = ReadOnly (but was ' + entity.info.type + ')');
  }
}

export interface PublishedReferencesFields {
  any: EntityReference | null;
  anyList: Array<EntityReference> | null;
  titleOnly: EntityReference | null;
}

export type PublishedReferences = PublishedEntity<'References', PublishedReferencesFields>;

export function isPublishedReferences(
  entity: PublishedEntity | PublishedReferences
): entity is PublishedReferences {
  return entity.info.type === 'References';
}

export function assertIsPublishedReferences(
  entity: PublishedEntity | PublishedReferences
): asserts entity is PublishedReferences {
  if (entity.info.type !== 'References') {
    throw new Error('Expected info.type = References (but was ' + entity.info.type + ')');
  }
}

export interface PublishedRichTextsFields {
  richText: RichText | null;
  richTextList: Array<RichText> | null;
  richTextOnlyParagraphAndText: RichText | null;
}

export type PublishedRichTexts = PublishedEntity<'RichTexts', PublishedRichTextsFields>;

export function isPublishedRichTexts(
  entity: PublishedEntity | PublishedRichTexts
): entity is PublishedRichTexts {
  return entity.info.type === 'RichTexts';
}

export function assertIsPublishedRichTexts(
  entity: PublishedEntity | PublishedRichTexts
): asserts entity is PublishedRichTexts {
  if (entity.info.type !== 'RichTexts') {
    throw new Error('Expected info.type = RichTexts (but was ' + entity.info.type + ')');
  }
}

export interface PublishedStringsFields {
  multiline: string | null;
}

export type PublishedStrings = PublishedEntity<'Strings', PublishedStringsFields>;

export function isPublishedStrings(
  entity: PublishedEntity | PublishedStrings
): entity is PublishedStrings {
  return entity.info.type === 'Strings';
}

export function assertIsPublishedStrings(
  entity: PublishedEntity | PublishedStrings
): asserts entity is PublishedStrings {
  if (entity.info.type !== 'Strings') {
    throw new Error('Expected info.type = Strings (but was ' + entity.info.type + ')');
  }
}

export interface PublishedSubjectOnlyFields {
  message: string | null;
}

export type PublishedSubjectOnly = PublishedEntity<'SubjectOnly', PublishedSubjectOnlyFields>;

export function isPublishedSubjectOnly(
  entity: PublishedEntity | PublishedSubjectOnly
): entity is PublishedSubjectOnly {
  return entity.info.type === 'SubjectOnly';
}

export function assertIsPublishedSubjectOnly(
  entity: PublishedEntity | PublishedSubjectOnly
): asserts entity is PublishedSubjectOnly {
  if (entity.info.type !== 'SubjectOnly') {
    throw new Error('Expected info.type = SubjectOnly (but was ' + entity.info.type + ')');
  }
}

export interface PublishedTitleOnlyFields {
  title: string | null;
}

export type PublishedTitleOnly = PublishedEntity<'TitleOnly', PublishedTitleOnlyFields>;

export function isPublishedTitleOnly(
  entity: PublishedEntity | PublishedTitleOnly
): entity is PublishedTitleOnly {
  return entity.info.type === 'TitleOnly';
}

export function assertIsPublishedTitleOnly(
  entity: PublishedEntity | PublishedTitleOnly
): asserts entity is PublishedTitleOnly {
  if (entity.info.type !== 'TitleOnly') {
    throw new Error('Expected info.type = TitleOnly (but was ' + entity.info.type + ')');
  }
}

export interface PublishedValueItemsFields {
  any: AllPublishedValueItems | null;
}

export type PublishedValueItems = PublishedEntity<'ValueItems', PublishedValueItemsFields>;

export function isPublishedValueItems(
  entity: PublishedEntity | PublishedValueItems
): entity is PublishedValueItems {
  return entity.info.type === 'ValueItems';
}

export function assertIsPublishedValueItems(
  entity: PublishedEntity | PublishedValueItems
): asserts entity is PublishedValueItems {
  if (entity.info.type !== 'ValueItems') {
    throw new Error('Expected info.type = ValueItems (but was ' + entity.info.type + ')');
  }
}

export type AllPublishedValueItems = PublishedLocationsValue | PublishedReferencesValue;

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
