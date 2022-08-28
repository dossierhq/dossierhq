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

export interface AdminLocationsValueFields {
  location: Location | null;
}

export type AdminLocationsValue = ValueItem<'LocationsValue', AdminLocationsValueFields>;

export interface AdminReferencesValueFields {
  reference: EntityReference | null;
}

export type AdminReferencesValue = ValueItem<'ReferencesValue', AdminReferencesValueFields>;

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

export interface PublishedLocationsValueFields {
  location: Location | null;
}

export type PublishedLocationsValue = ValueItem<'LocationsValue', PublishedLocationsValueFields>;

export interface PublishedReferencesValueFields {
  reference: EntityReference | null;
}

export type PublishedReferencesValue = ValueItem<'ReferencesValue', PublishedReferencesValueFields>;
