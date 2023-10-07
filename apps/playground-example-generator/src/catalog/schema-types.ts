import type {
  AdminClient,
  AdminEntity,
  AdminExceptionClient,
  Component,
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
  | AdminEntitiesEntity
  | AdminLocationsEntity
  | AdminNumbersEntity
  | AdminRichTextsEntity
  | AdminStringsEntity;

export interface AdminBooleansEntityFields {
  normal: boolean | null;
  required: boolean | null;
  list: boolean[] | null;
}

export type AdminBooleansEntity = AdminEntity<'BooleansEntity', AdminBooleansEntityFields, string>;

export function isAdminBooleansEntity(
  entity: AdminEntity<string, object>,
): entity is AdminBooleansEntity {
  return entity.info.type === 'BooleansEntity';
}

export function assertIsAdminBooleansEntity(
  entity: AdminEntity<string, object>,
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

export type AdminComponentsEntity = AdminEntity<
  'ComponentsEntity',
  AdminComponentsEntityFields,
  string
>;

export function isAdminComponentsEntity(
  entity: AdminEntity<string, object>,
): entity is AdminComponentsEntity {
  return entity.info.type === 'ComponentsEntity';
}

export function assertIsAdminComponentsEntity(
  entity: AdminEntity<string, object>,
): asserts entity is AdminComponentsEntity {
  if (entity.info.type !== 'ComponentsEntity') {
    throw new Error('Expected info.type = ComponentsEntity (but was ' + entity.info.type + ')');
  }
}

export interface AdminEntitiesEntityFields {
  normal: EntityReference | null;
  required: EntityReference | null;
  list: EntityReference[] | null;
  stringsEntity: EntityReference | null;
  stringsEntityList: EntityReference[] | null;
  stringsAndLocationsEntity: EntityReference | null;
  stringsAndLocationsEntityList: EntityReference[] | null;
}

export type AdminEntitiesEntity = AdminEntity<'EntitiesEntity', AdminEntitiesEntityFields, string>;

export function isAdminEntitiesEntity(
  entity: AdminEntity<string, object>,
): entity is AdminEntitiesEntity {
  return entity.info.type === 'EntitiesEntity';
}

export function assertIsAdminEntitiesEntity(
  entity: AdminEntity<string, object>,
): asserts entity is AdminEntitiesEntity {
  if (entity.info.type !== 'EntitiesEntity') {
    throw new Error('Expected info.type = EntitiesEntity (but was ' + entity.info.type + ')');
  }
}

export interface AdminLocationsEntityFields {
  normal: Location | null;
  required: Location | null;
  list: Location[] | null;
  requiredList: Location[] | null;
}

export type AdminLocationsEntity = AdminEntity<
  'LocationsEntity',
  AdminLocationsEntityFields,
  string
>;

export function isAdminLocationsEntity(
  entity: AdminEntity<string, object>,
): entity is AdminLocationsEntity {
  return entity.info.type === 'LocationsEntity';
}

export function assertIsAdminLocationsEntity(
  entity: AdminEntity<string, object>,
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

export type AdminNumbersEntity = AdminEntity<'NumbersEntity', AdminNumbersEntityFields, string>;

export function isAdminNumbersEntity(
  entity: AdminEntity<string, object>,
): entity is AdminNumbersEntity {
  return entity.info.type === 'NumbersEntity';
}

export function assertIsAdminNumbersEntity(
  entity: AdminEntity<string, object>,
): asserts entity is AdminNumbersEntity {
  if (entity.info.type !== 'NumbersEntity') {
    throw new Error('Expected info.type = NumbersEntity (but was ' + entity.info.type + ')');
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

export type AdminRichTextsEntity = AdminEntity<
  'RichTextsEntity',
  AdminRichTextsEntityFields,
  string
>;

export function isAdminRichTextsEntity(
  entity: AdminEntity<string, object>,
): entity is AdminRichTextsEntity {
  return entity.info.type === 'RichTextsEntity';
}

export function assertIsAdminRichTextsEntity(
  entity: AdminEntity<string, object>,
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

export type AdminStringsEntity = AdminEntity<'StringsEntity', AdminStringsEntityFields, string>;

export function isAdminStringsEntity(
  entity: AdminEntity<string, object>,
): entity is AdminStringsEntity {
  return entity.info.type === 'StringsEntity';
}

export function assertIsAdminStringsEntity(
  entity: AdminEntity<string, object>,
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
