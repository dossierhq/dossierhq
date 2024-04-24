import type {
  AdminExceptionClient,
  Component,
  DossierClient,
  Entity,
  EntityReference,
  Location,
  PublishedClient,
  PublishedEntity,
  PublishedExceptionClient,
  RichText,
} from '@dossierhq/core';

export type AppAdminClient = DossierClient<
  AppEntity,
  AppComponent,
  AppUniqueIndexes,
  AppAdminExceptionClient
>;

export type AppAdminExceptionClient = AdminExceptionClient<
  AppEntity,
  AppComponent,
  AppUniqueIndexes
>;

export type AppUniqueIndexes = 'genericUnique' | 'stringsUnique';

export type AppEntity =
  | ChangeValidations
  | Components
  | Locations
  | MigrationEntity
  | ReadOnly
  | References
  | RichTexts
  | Strings
  | SubjectOnly
  | SubjectOrDefaultAuthKey
  | TitleOnly;

export interface ChangeValidationsFields {
  required: string | null;
  matchPattern: string | null;
  richText: RichText | null;
  component: AppComponent | null;
  componentList: AppComponent[] | null;
}

export type ChangeValidations = Entity<'ChangeValidations', ChangeValidationsFields, ''>;

export function isChangeValidations(entity: Entity<string, object>): entity is ChangeValidations {
  return entity.info.type === 'ChangeValidations';
}

export function assertIsChangeValidations(
  entity: Entity<string, object>,
): asserts entity is ChangeValidations {
  if (entity.info.type !== 'ChangeValidations') {
    throw new Error('Expected info.type = ChangeValidations (but was ' + entity.info.type + ')');
  }
}

export interface ComponentsFields {
  any: AppComponent | null;
  anyAdminOnly: AppComponent | null;
}

export type Components = Entity<'Components', ComponentsFields, ''>;

export function isComponents(entity: Entity<string, object>): entity is Components {
  return entity.info.type === 'Components';
}

export function assertIsComponents(entity: Entity<string, object>): asserts entity is Components {
  if (entity.info.type !== 'Components') {
    throw new Error('Expected info.type = Components (but was ' + entity.info.type + ')');
  }
}

export interface LocationsFields {
  location: Location | null;
  locationList: Location[] | null;
  locationAdminOnly: Location | null;
}

export type Locations = Entity<'Locations', LocationsFields, ''>;

export function isLocations(entity: Entity<string, object>): entity is Locations {
  return entity.info.type === 'Locations';
}

export function assertIsLocations(entity: Entity<string, object>): asserts entity is Locations {
  if (entity.info.type !== 'Locations') {
    throw new Error('Expected info.type = Locations (but was ' + entity.info.type + ')');
  }
}

export type MigrationEntityFields = Record<never, never>;

export type MigrationEntity = Entity<'MigrationEntity', MigrationEntityFields, ''>;

export function isMigrationEntity(entity: Entity<string, object>): entity is MigrationEntity {
  return entity.info.type === 'MigrationEntity';
}

export function assertIsMigrationEntity(
  entity: Entity<string, object>,
): asserts entity is MigrationEntity {
  if (entity.info.type !== 'MigrationEntity') {
    throw new Error('Expected info.type = MigrationEntity (but was ' + entity.info.type + ')');
  }
}

export interface ReadOnlyFields {
  message: string | null;
}

export type ReadOnly = Entity<'ReadOnly', ReadOnlyFields, '' | 'subject'>;

export function isReadOnly(entity: Entity<string, object>): entity is ReadOnly {
  return entity.info.type === 'ReadOnly';
}

export function assertIsReadOnly(entity: Entity<string, object>): asserts entity is ReadOnly {
  if (entity.info.type !== 'ReadOnly') {
    throw new Error('Expected info.type = ReadOnly (but was ' + entity.info.type + ')');
  }
}

export interface ReferencesFields {
  any: EntityReference | null;
  anyList: EntityReference[] | null;
  anyAdminOnly: EntityReference | null;
  titleOnly: EntityReference | null;
}

export type References = Entity<'References', ReferencesFields, ''>;

export function isReferences(entity: Entity<string, object>): entity is References {
  return entity.info.type === 'References';
}

export function assertIsReferences(entity: Entity<string, object>): asserts entity is References {
  if (entity.info.type !== 'References') {
    throw new Error('Expected info.type = References (but was ' + entity.info.type + ')');
  }
}

export interface RichTextsFields {
  richText: RichText | null;
  richTextList: RichText[] | null;
  richTextMinimal: RichText | null;
  richTextLimitedTypes: RichText | null;
}

export type RichTexts = Entity<'RichTexts', RichTextsFields, ''>;

export function isRichTexts(entity: Entity<string, object>): entity is RichTexts {
  return entity.info.type === 'RichTexts';
}

export function assertIsRichTexts(entity: Entity<string, object>): asserts entity is RichTexts {
  if (entity.info.type !== 'RichTexts') {
    throw new Error('Expected info.type = RichTexts (but was ' + entity.info.type + ')');
  }
}

export interface StringsFields {
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

export type Strings = Entity<'Strings', StringsFields, ''>;

export function isStrings(entity: Entity<string, object>): entity is Strings {
  return entity.info.type === 'Strings';
}

export function assertIsStrings(entity: Entity<string, object>): asserts entity is Strings {
  if (entity.info.type !== 'Strings') {
    throw new Error('Expected info.type = Strings (but was ' + entity.info.type + ')');
  }
}

export interface SubjectOnlyFields {
  message: string | null;
}

export type SubjectOnly = Entity<'SubjectOnly', SubjectOnlyFields, 'subject'>;

export function isSubjectOnly(entity: Entity<string, object>): entity is SubjectOnly {
  return entity.info.type === 'SubjectOnly';
}

export function assertIsSubjectOnly(entity: Entity<string, object>): asserts entity is SubjectOnly {
  if (entity.info.type !== 'SubjectOnly') {
    throw new Error('Expected info.type = SubjectOnly (but was ' + entity.info.type + ')');
  }
}

export interface SubjectOrDefaultAuthKeyFields {
  message: string | null;
}

export type SubjectOrDefaultAuthKey = Entity<
  'SubjectOrDefaultAuthKey',
  SubjectOrDefaultAuthKeyFields,
  '' | 'subject'
>;

export function isSubjectOrDefaultAuthKey(
  entity: Entity<string, object>,
): entity is SubjectOrDefaultAuthKey {
  return entity.info.type === 'SubjectOrDefaultAuthKey';
}

export function assertIsSubjectOrDefaultAuthKey(
  entity: Entity<string, object>,
): asserts entity is SubjectOrDefaultAuthKey {
  if (entity.info.type !== 'SubjectOrDefaultAuthKey') {
    throw new Error(
      'Expected info.type = SubjectOrDefaultAuthKey (but was ' + entity.info.type + ')',
    );
  }
}

export interface TitleOnlyFields {
  title: string | null;
}

export type TitleOnly = Entity<'TitleOnly', TitleOnlyFields, ''>;

export function isTitleOnly(entity: Entity<string, object>): entity is TitleOnly {
  return entity.info.type === 'TitleOnly';
}

export function assertIsTitleOnly(entity: Entity<string, object>): asserts entity is TitleOnly {
  if (entity.info.type !== 'TitleOnly') {
    throw new Error('Expected info.type = TitleOnly (but was ' + entity.info.type + ')');
  }
}

export type AppComponent =
  | AdminOnlyComponent
  | ChangeValidationsComponent
  | LocationsComponent
  | MigrationComponent
  | ReferencesComponent;

export type AdminOnlyComponentFields = Record<never, never>;

export type AdminOnlyComponent = Component<'AdminOnlyComponent', AdminOnlyComponentFields>;

export function isAdminOnlyComponent(
  component: Component<string, object> | AdminOnlyComponent,
): component is AdminOnlyComponent {
  return component.type === 'AdminOnlyComponent';
}

export function assertIsAdminOnlyComponent(
  component: Component<string, object> | AdminOnlyComponent,
): asserts component is AdminOnlyComponent {
  if (component.type !== 'AdminOnlyComponent') {
    throw new Error('Expected type = AdminOnlyComponent (but was ' + component.type + ')');
  }
}

export interface ChangeValidationsComponentFields {
  matchPattern: string | null;
}

export type ChangeValidationsComponent = Component<
  'ChangeValidationsComponent',
  ChangeValidationsComponentFields
>;

export function isChangeValidationsComponent(
  component: Component<string, object> | ChangeValidationsComponent,
): component is ChangeValidationsComponent {
  return component.type === 'ChangeValidationsComponent';
}

export function assertIsChangeValidationsComponent(
  component: Component<string, object> | ChangeValidationsComponent,
): asserts component is ChangeValidationsComponent {
  if (component.type !== 'ChangeValidationsComponent') {
    throw new Error('Expected type = ChangeValidationsComponent (but was ' + component.type + ')');
  }
}

export interface LocationsComponentFields {
  location: Location | null;
  locationAdminOnly: Location | null;
}

export type LocationsComponent = Component<'LocationsComponent', LocationsComponentFields>;

export function isLocationsComponent(
  component: Component<string, object> | LocationsComponent,
): component is LocationsComponent {
  return component.type === 'LocationsComponent';
}

export function assertIsLocationsComponent(
  component: Component<string, object> | LocationsComponent,
): asserts component is LocationsComponent {
  if (component.type !== 'LocationsComponent') {
    throw new Error('Expected type = LocationsComponent (but was ' + component.type + ')');
  }
}

export type MigrationComponentFields = Record<never, never>;

export type MigrationComponent = Component<'MigrationComponent', MigrationComponentFields>;

export function isMigrationComponent(
  component: Component<string, object> | MigrationComponent,
): component is MigrationComponent {
  return component.type === 'MigrationComponent';
}

export function assertIsMigrationComponent(
  component: Component<string, object> | MigrationComponent,
): asserts component is MigrationComponent {
  if (component.type !== 'MigrationComponent') {
    throw new Error('Expected type = MigrationComponent (but was ' + component.type + ')');
  }
}

export interface ReferencesComponentFields {
  reference: EntityReference | null;
}

export type ReferencesComponent = Component<'ReferencesComponent', ReferencesComponentFields>;

export function isReferencesComponent(
  component: Component<string, object> | ReferencesComponent,
): component is ReferencesComponent {
  return component.type === 'ReferencesComponent';
}

export function assertIsReferencesComponent(
  component: Component<string, object> | ReferencesComponent,
): asserts component is ReferencesComponent {
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
