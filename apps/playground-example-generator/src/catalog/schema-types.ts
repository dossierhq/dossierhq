import type {
  AdminClient,
  AdminExceptionClient,
  Component,
  Entity,
  EntityReference,
  Location,
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

export type AppAdminUniqueIndexes = 'slug';

export type AppAdminEntity =
  | AdminBooleansEntity
  | AdminComponentsEntity
  | AdminLocationsEntity
  | AdminNumbersEntity
  | AdminReferencesEntity
  | AdminRichTextsEntity
  | AdminStringsEntity;

export interface AdminBooleansEntityFields {
  normal: boolean | null;
  required: boolean | null;
  list: boolean[] | null;
}

export type AdminBooleansEntity = Entity<'BooleansEntity', AdminBooleansEntityFields, ''>;

export function isAdminBooleansEntity(
  entity: Entity<string, object>,
): entity is AdminBooleansEntity {
  return entity.info.type === 'BooleansEntity';
}

export function assertIsAdminBooleansEntity(
  entity: Entity<string, object>,
): asserts entity is AdminBooleansEntity {
  if (entity.info.type !== 'BooleansEntity') {
    throw new Error('Expected info.type = BooleansEntity (but was ' + entity.info.type + ')');
  }
}

export interface AdminComponentsEntityFields {
  normal: AppAdminComponent | null;
  required: AppAdminComponent | null;
  list: AppAdminComponent[] | null;
  requiredList: AppAdminComponent[] | null;
  adminOnly: AppAdminComponent | null;
  cloudinaryImage: AdminCloudinaryImage | null;
}

export type AdminComponentsEntity = Entity<'ComponentsEntity', AdminComponentsEntityFields, ''>;

export function isAdminComponentsEntity(
  entity: Entity<string, object>,
): entity is AdminComponentsEntity {
  return entity.info.type === 'ComponentsEntity';
}

export function assertIsAdminComponentsEntity(
  entity: Entity<string, object>,
): asserts entity is AdminComponentsEntity {
  if (entity.info.type !== 'ComponentsEntity') {
    throw new Error('Expected info.type = ComponentsEntity (but was ' + entity.info.type + ')');
  }
}

export interface AdminLocationsEntityFields {
  normal: Location | null;
  required: Location | null;
  list: Location[] | null;
  requiredList: Location[] | null;
}

export type AdminLocationsEntity = Entity<'LocationsEntity', AdminLocationsEntityFields, ''>;

export function isAdminLocationsEntity(
  entity: Entity<string, object>,
): entity is AdminLocationsEntity {
  return entity.info.type === 'LocationsEntity';
}

export function assertIsAdminLocationsEntity(
  entity: Entity<string, object>,
): asserts entity is AdminLocationsEntity {
  if (entity.info.type !== 'LocationsEntity') {
    throw new Error('Expected info.type = LocationsEntity (but was ' + entity.info.type + ')');
  }
}

export interface AdminNumbersEntityFields {
  normal: number | null;
  required: number | null;
  integer: number | null;
  list: number[] | null;
  requiredList: number[] | null;
  requiredIntegerList: number[] | null;
}

export type AdminNumbersEntity = Entity<'NumbersEntity', AdminNumbersEntityFields, ''>;

export function isAdminNumbersEntity(entity: Entity<string, object>): entity is AdminNumbersEntity {
  return entity.info.type === 'NumbersEntity';
}

export function assertIsAdminNumbersEntity(
  entity: Entity<string, object>,
): asserts entity is AdminNumbersEntity {
  if (entity.info.type !== 'NumbersEntity') {
    throw new Error('Expected info.type = NumbersEntity (but was ' + entity.info.type + ')');
  }
}

export interface AdminReferencesEntityFields {
  normal: EntityReference | null;
  required: EntityReference | null;
  list: EntityReference[] | null;
  stringsEntity: EntityReference | null;
  stringsEntityList: EntityReference[] | null;
  stringsAndLocationsEntity: EntityReference | null;
  stringsAndLocationsEntityList: EntityReference[] | null;
}

export type AdminReferencesEntity = Entity<'ReferencesEntity', AdminReferencesEntityFields, ''>;

export function isAdminReferencesEntity(
  entity: Entity<string, object>,
): entity is AdminReferencesEntity {
  return entity.info.type === 'ReferencesEntity';
}

export function assertIsAdminReferencesEntity(
  entity: Entity<string, object>,
): asserts entity is AdminReferencesEntity {
  if (entity.info.type !== 'ReferencesEntity') {
    throw new Error('Expected info.type = ReferencesEntity (but was ' + entity.info.type + ')');
  }
}

export interface AdminRichTextsEntityFields {
  normal: RichText | null;
  required: RichText | null;
  minimal: RichText | null;
  code: RichText | null;
  list: RichText[] | null;
  adminOnly: RichText | null;
  stringsEntity: RichText | null;
  numbersEntityLink: RichText | null;
  nestedComponent: RichText | null;
}

export type AdminRichTextsEntity = Entity<'RichTextsEntity', AdminRichTextsEntityFields, ''>;

export function isAdminRichTextsEntity(
  entity: Entity<string, object>,
): entity is AdminRichTextsEntity {
  return entity.info.type === 'RichTextsEntity';
}

export function assertIsAdminRichTextsEntity(
  entity: Entity<string, object>,
): asserts entity is AdminRichTextsEntity {
  if (entity.info.type !== 'RichTextsEntity') {
    throw new Error('Expected info.type = RichTextsEntity (but was ' + entity.info.type + ')');
  }
}

export interface AdminStringsEntityFields {
  title: string | null;
  normal: string | null;
  required: string | null;
  multiline: string | null;
  index: string | null;
  matchPattern: string | null;
  values: 'bar' | 'baz' | 'foo' | null;
  valuesList: ('bar' | 'baz' | 'foo')[] | null;
  list: string[] | null;
  multilineList: string[] | null;
  requiredList: string[] | null;
  requiredListMatchPattern: string[] | null;
}

export type AdminStringsEntity = Entity<'StringsEntity', AdminStringsEntityFields, ''>;

export function isAdminStringsEntity(entity: Entity<string, object>): entity is AdminStringsEntity {
  return entity.info.type === 'StringsEntity';
}

export function assertIsAdminStringsEntity(
  entity: Entity<string, object>,
): asserts entity is AdminStringsEntity {
  if (entity.info.type !== 'StringsEntity') {
    throw new Error('Expected info.type = StringsEntity (but was ' + entity.info.type + ')');
  }
}

export type AppAdminComponent =
  | AdminAdminOnlyComponent
  | AdminCloudinaryImage
  | AdminNestedComponent
  | AdminStringsComponent;

export interface AdminAdminOnlyComponentFields {
  text: string | null;
}

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

export interface AdminCloudinaryImageFields {
  publicId: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
}

export type AdminCloudinaryImage = Component<'CloudinaryImage', AdminCloudinaryImageFields>;

export function isAdminCloudinaryImage(
  component: Component<string, object> | AdminCloudinaryImage,
): component is AdminCloudinaryImage {
  return component.type === 'CloudinaryImage';
}

export function assertIsAdminCloudinaryImage(
  component: Component<string, object> | AdminCloudinaryImage,
): asserts component is AdminCloudinaryImage {
  if (component.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + component.type + ')');
  }
}

export interface AdminNestedComponentFields {
  text: string | null;
  child: AdminNestedComponent | null;
}

export type AdminNestedComponent = Component<'NestedComponent', AdminNestedComponentFields>;

export function isAdminNestedComponent(
  component: Component<string, object> | AdminNestedComponent,
): component is AdminNestedComponent {
  return component.type === 'NestedComponent';
}

export function assertIsAdminNestedComponent(
  component: Component<string, object> | AdminNestedComponent,
): asserts component is AdminNestedComponent {
  if (component.type !== 'NestedComponent') {
    throw new Error('Expected type = NestedComponent (but was ' + component.type + ')');
  }
}

export interface AdminStringsComponentFields {
  normal: string | null;
  required: string | null;
  matchPattern: string | null;
  list: string[] | null;
  requiredList: string[] | null;
  requiredListMatchPattern: string[] | null;
}

export type AdminStringsComponent = Component<'StringsComponent', AdminStringsComponentFields>;

export function isAdminStringsComponent(
  component: Component<string, object> | AdminStringsComponent,
): component is AdminStringsComponent {
  return component.type === 'StringsComponent';
}

export function assertIsAdminStringsComponent(
  component: Component<string, object> | AdminStringsComponent,
): asserts component is AdminStringsComponent {
  if (component.type !== 'StringsComponent') {
    throw new Error('Expected type = StringsComponent (but was ' + component.type + ')');
  }
}
