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
  | AdminComponents
  | AdminLocations
  | AdminMigrationEntity
  | AdminReadOnly
  | AdminReferences
  | AdminRichTexts
  | AdminStrings
  | AdminSubjectOnly
  | AdminSubjectOrDefaultAuthKey
  | AdminTitleOnly;

export interface AdminChangeValidationsFields {
  required: string | null;
  matchPattern: string | null;
  richText: RichText | null;
  component: AppAdminComponent | null;
  componentList: AppAdminComponent[] | null;
}

export type AdminChangeValidations = AdminEntity<
  'ChangeValidations',
  AdminChangeValidationsFields,
  ''
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

export interface AdminComponentsFields {
  any: AppAdminComponent | null;
  anyAdminOnly: AppAdminComponent | null;
}

export type AdminComponents = AdminEntity<'Components', AdminComponentsFields, ''>;

export function isAdminComponents(entity: AdminEntity<string, object>): entity is AdminComponents {
  return entity.info.type === 'Components';
}

export function assertIsAdminComponents(
  entity: AdminEntity<string, object>,
): asserts entity is AdminComponents {
  if (entity.info.type !== 'Components') {
    throw new Error('Expected info.type = Components (but was ' + entity.info.type + ')');
  }
}

export interface AdminLocationsFields {
  location: Location | null;
  locationList: Location[] | null;
  locationAdminOnly: Location | null;
}

export type AdminLocations = AdminEntity<'Locations', AdminLocationsFields, ''>;

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

export type AdminMigrationEntity = AdminEntity<'MigrationEntity', AdminMigrationEntityFields, ''>;

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

export type AdminReadOnly = AdminEntity<'ReadOnly', AdminReadOnlyFields, '' | 'subject'>;

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

export type AdminReferences = AdminEntity<'References', AdminReferencesFields, ''>;

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

export type AdminRichTexts = AdminEntity<'RichTexts', AdminRichTextsFields, ''>;

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

export type AdminStrings = AdminEntity<'Strings', AdminStringsFields, ''>;

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

export type AdminSubjectOnly = AdminEntity<'SubjectOnly', AdminSubjectOnlyFields, 'subject'>;

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

export interface AdminSubjectOrDefaultAuthKeyFields {
  message: string | null;
}

export type AdminSubjectOrDefaultAuthKey = AdminEntity<
  'SubjectOrDefaultAuthKey',
  AdminSubjectOrDefaultAuthKeyFields,
  '' | 'subject'
>;

export function isAdminSubjectOrDefaultAuthKey(
  entity: AdminEntity<string, object>,
): entity is AdminSubjectOrDefaultAuthKey {
  return entity.info.type === 'SubjectOrDefaultAuthKey';
}

export function assertIsAdminSubjectOrDefaultAuthKey(
  entity: AdminEntity<string, object>,
): asserts entity is AdminSubjectOrDefaultAuthKey {
  if (entity.info.type !== 'SubjectOrDefaultAuthKey') {
    throw new Error(
      'Expected info.type = SubjectOrDefaultAuthKey (but was ' + entity.info.type + ')',
    );
  }
}

export interface AdminTitleOnlyFields {
  title: string | null;
}

export type AdminTitleOnly = AdminEntity<'TitleOnly', AdminTitleOnlyFields, ''>;

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

export type AppAdminComponent =
  | AdminAdminOnlyComponent
  | AdminChangeValidationsComponent
  | AdminLocationsComponent
  | AdminMigrationComponent
  | AdminReferencesComponent;

export type AdminAdminOnlyComponentFields = Record<never, never>;

export type AdminAdminOnlyComponent = Component<
  'AdminOnlyComponent',
  AdminAdminOnlyComponentFields
>;

export function isAdminAdminOnlyComponent(
  component: Component<string, object> | AdminAdminOnlyComponent,
): component is AdminAdminOnlyComponent {
  return component.type === 'AdminOnlyComponent';
}

export function assertIsAdminAdminOnlyComponent(
  component: Component<string, object> | AdminAdminOnlyComponent,
): asserts component is AdminAdminOnlyComponent {
  if (component.type !== 'AdminOnlyComponent') {
    throw new Error('Expected type = AdminOnlyComponent (but was ' + component.type + ')');
  }
}

export interface AdminChangeValidationsComponentFields {
  matchPattern: string | null;
}

export type AdminChangeValidationsComponent = Component<
  'ChangeValidationsComponent',
  AdminChangeValidationsComponentFields
>;

export function isAdminChangeValidationsComponent(
  component: Component<string, object> | AdminChangeValidationsComponent,
): component is AdminChangeValidationsComponent {
  return component.type === 'ChangeValidationsComponent';
}

export function assertIsAdminChangeValidationsComponent(
  component: Component<string, object> | AdminChangeValidationsComponent,
): asserts component is AdminChangeValidationsComponent {
  if (component.type !== 'ChangeValidationsComponent') {
    throw new Error('Expected type = ChangeValidationsComponent (but was ' + component.type + ')');
  }
}

export interface AdminLocationsComponentFields {
  location: Location | null;
  locationAdminOnly: Location | null;
}

export type AdminLocationsComponent = Component<
  'LocationsComponent',
  AdminLocationsComponentFields
>;

export function isAdminLocationsComponent(
  component: Component<string, object> | AdminLocationsComponent,
): component is AdminLocationsComponent {
  return component.type === 'LocationsComponent';
}

export function assertIsAdminLocationsComponent(
  component: Component<string, object> | AdminLocationsComponent,
): asserts component is AdminLocationsComponent {
  if (component.type !== 'LocationsComponent') {
    throw new Error('Expected type = LocationsComponent (but was ' + component.type + ')');
  }
}

export type AdminMigrationComponentFields = Record<never, never>;

export type AdminMigrationComponent = Component<
  'MigrationComponent',
  AdminMigrationComponentFields
>;

export function isAdminMigrationComponent(
  component: Component<string, object> | AdminMigrationComponent,
): component is AdminMigrationComponent {
  return component.type === 'MigrationComponent';
}

export function assertIsAdminMigrationComponent(
  component: Component<string, object> | AdminMigrationComponent,
): asserts component is AdminMigrationComponent {
  if (component.type !== 'MigrationComponent') {
    throw new Error('Expected type = MigrationComponent (but was ' + component.type + ')');
  }
}

export interface AdminReferencesComponentFields {
  reference: EntityReference | null;
}

export type AdminReferencesComponent = Component<
  'ReferencesComponent',
  AdminReferencesComponentFields
>;

export function isAdminReferencesComponent(
  component: Component<string, object> | AdminReferencesComponent,
): component is AdminReferencesComponent {
  return component.type === 'ReferencesComponent';
}

export function assertIsAdminReferencesComponent(
  component: Component<string, object> | AdminReferencesComponent,
): asserts component is AdminReferencesComponent {
  if (component.type !== 'ReferencesComponent') {
    throw new Error('Expected type = ReferencesComponent (but was ' + component.type + ')');
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
  | PublishedComponents
  | PublishedLocations
  | PublishedMigrationEntity
  | PublishedReadOnly
  | PublishedReferences
  | PublishedRichTexts
  | PublishedStrings
  | PublishedSubjectOnly
  | PublishedSubjectOrDefaultAuthKey
  | PublishedTitleOnly;

export interface PublishedChangeValidationsFields {
  required: string;
  matchPattern: string | null;
  richText: RichText | null;
  component: AppPublishedComponent | null;
  componentList: AppPublishedComponent[] | null;
}

export type PublishedChangeValidations = PublishedEntity<
  'ChangeValidations',
  PublishedChangeValidationsFields,
  ''
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

export interface PublishedComponentsFields {
  any: AppPublishedComponent | null;
}

export type PublishedComponents = PublishedEntity<'Components', PublishedComponentsFields, ''>;

export function isPublishedComponents(
  entity: PublishedEntity<string, object>,
): entity is PublishedComponents {
  return entity.info.type === 'Components';
}

export function assertIsPublishedComponents(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedComponents {
  if (entity.info.type !== 'Components') {
    throw new Error('Expected info.type = Components (but was ' + entity.info.type + ')');
  }
}

export interface PublishedLocationsFields {
  location: Location | null;
  locationList: Location[] | null;
}

export type PublishedLocations = PublishedEntity<'Locations', PublishedLocationsFields, ''>;

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
  ''
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

export type PublishedReadOnly = PublishedEntity<
  'ReadOnly',
  PublishedReadOnlyFields,
  '' | 'subject'
>;

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

export type PublishedReferences = PublishedEntity<'References', PublishedReferencesFields, ''>;

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

export type PublishedRichTexts = PublishedEntity<'RichTexts', PublishedRichTextsFields, ''>;

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

export type PublishedStrings = PublishedEntity<'Strings', PublishedStringsFields, ''>;

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
  'subject'
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

export interface PublishedSubjectOrDefaultAuthKeyFields {
  message: string;
}

export type PublishedSubjectOrDefaultAuthKey = PublishedEntity<
  'SubjectOrDefaultAuthKey',
  PublishedSubjectOrDefaultAuthKeyFields,
  '' | 'subject'
>;

export function isPublishedSubjectOrDefaultAuthKey(
  entity: PublishedEntity<string, object>,
): entity is PublishedSubjectOrDefaultAuthKey {
  return entity.info.type === 'SubjectOrDefaultAuthKey';
}

export function assertIsPublishedSubjectOrDefaultAuthKey(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedSubjectOrDefaultAuthKey {
  if (entity.info.type !== 'SubjectOrDefaultAuthKey') {
    throw new Error(
      'Expected info.type = SubjectOrDefaultAuthKey (but was ' + entity.info.type + ')',
    );
  }
}

export interface PublishedTitleOnlyFields {
  title: string;
}

export type PublishedTitleOnly = PublishedEntity<'TitleOnly', PublishedTitleOnlyFields, ''>;

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

export type AppPublishedComponent =
  | PublishedChangeValidationsComponent
  | PublishedLocationsComponent
  | PublishedMigrationComponent
  | PublishedReferencesComponent;

export interface PublishedChangeValidationsComponentFields {
  matchPattern: string | null;
}

export type PublishedChangeValidationsComponent = Component<
  'ChangeValidationsComponent',
  PublishedChangeValidationsComponentFields
>;

export function isPublishedChangeValidationsComponent(
  component: Component<string, object> | PublishedChangeValidationsComponent,
): component is PublishedChangeValidationsComponent {
  return component.type === 'ChangeValidationsComponent';
}

export function assertIsPublishedChangeValidationsComponent(
  component: Component<string, object> | PublishedChangeValidationsComponent,
): asserts component is PublishedChangeValidationsComponent {
  if (component.type !== 'ChangeValidationsComponent') {
    throw new Error('Expected type = ChangeValidationsComponent (but was ' + component.type + ')');
  }
}

export interface PublishedLocationsComponentFields {
  location: Location | null;
}

export type PublishedLocationsComponent = Component<
  'LocationsComponent',
  PublishedLocationsComponentFields
>;

export function isPublishedLocationsComponent(
  component: Component<string, object> | PublishedLocationsComponent,
): component is PublishedLocationsComponent {
  return component.type === 'LocationsComponent';
}

export function assertIsPublishedLocationsComponent(
  component: Component<string, object> | PublishedLocationsComponent,
): asserts component is PublishedLocationsComponent {
  if (component.type !== 'LocationsComponent') {
    throw new Error('Expected type = LocationsComponent (but was ' + component.type + ')');
  }
}

export type PublishedMigrationComponentFields = Record<never, never>;

export type PublishedMigrationComponent = Component<
  'MigrationComponent',
  PublishedMigrationComponentFields
>;

export function isPublishedMigrationComponent(
  component: Component<string, object> | PublishedMigrationComponent,
): component is PublishedMigrationComponent {
  return component.type === 'MigrationComponent';
}

export function assertIsPublishedMigrationComponent(
  component: Component<string, object> | PublishedMigrationComponent,
): asserts component is PublishedMigrationComponent {
  if (component.type !== 'MigrationComponent') {
    throw new Error('Expected type = MigrationComponent (but was ' + component.type + ')');
  }
}

export interface PublishedReferencesComponentFields {
  reference: EntityReference | null;
}

export type PublishedReferencesComponent = Component<
  'ReferencesComponent',
  PublishedReferencesComponentFields
>;

export function isPublishedReferencesComponent(
  component: Component<string, object> | PublishedReferencesComponent,
): component is PublishedReferencesComponent {
  return component.type === 'ReferencesComponent';
}

export function assertIsPublishedReferencesComponent(
  component: Component<string, object> | PublishedReferencesComponent,
): asserts component is PublishedReferencesComponent {
  if (component.type !== 'ReferencesComponent') {
    throw new Error('Expected type = ReferencesComponent (but was ' + component.type + ')');
  }
}
