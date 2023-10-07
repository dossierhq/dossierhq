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
  | AdminEntitiesEntity
  | AdminLocationsEntity
  | AdminNumbersEntity
  | AdminRichTextsEntity
  | AdminStringsEntity
  | AdminValueItemsEntity;

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
  nestedValueItem: RichText | null;
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

export interface AdminValueItemsEntityFields {
  normal: AppAdminComponent | null;
  required: AppAdminComponent | null;
  list: AppAdminComponent[] | null;
  requiredList: AppAdminComponent[] | null;
  adminOnly: AppAdminComponent | null;
  cloudinaryImage: AdminCloudinaryImage | null;
}

export type AdminValueItemsEntity = AdminEntity<
  'ValueItemsEntity',
  AdminValueItemsEntityFields,
  string
>;

export function isAdminValueItemsEntity(
  entity: AdminEntity<string, object>,
): entity is AdminValueItemsEntity {
  return entity.info.type === 'ValueItemsEntity';
}

export function assertIsAdminValueItemsEntity(
  entity: AdminEntity<string, object>,
): asserts entity is AdminValueItemsEntity {
  if (entity.info.type !== 'ValueItemsEntity') {
    throw new Error('Expected info.type = ValueItemsEntity (but was ' + entity.info.type + ')');
  }
}

export type AppAdminComponent =
  | AdminAdminOnlyValueItem
  | AdminCloudinaryImage
  | AdminNestedValueItem
  | AdminStringsValueItem;

export interface AdminAdminOnlyValueItemFields {
  text: string | null;
}

export type AdminAdminOnlyValueItem = Component<
  'AdminOnlyValueItem',
  AdminAdminOnlyValueItemFields
>;

export function isAdminAdminOnlyValueItem(
  component: Component<string, object> | AdminAdminOnlyValueItem,
): component is AdminAdminOnlyValueItem {
  return component.type === 'AdminOnlyValueItem';
}

export function assertIsAdminAdminOnlyValueItem(
  component: Component<string, object> | AdminAdminOnlyValueItem,
): asserts component is AdminAdminOnlyValueItem {
  if (component.type !== 'AdminOnlyValueItem') {
    throw new Error('Expected type = AdminOnlyValueItem (but was ' + component.type + ')');
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

export interface AdminNestedValueItemFields {
  text: string | null;
  child: AdminNestedValueItem | null;
}

export type AdminNestedValueItem = Component<'NestedValueItem', AdminNestedValueItemFields>;

export function isAdminNestedValueItem(
  component: Component<string, object> | AdminNestedValueItem,
): component is AdminNestedValueItem {
  return component.type === 'NestedValueItem';
}

export function assertIsAdminNestedValueItem(
  component: Component<string, object> | AdminNestedValueItem,
): asserts component is AdminNestedValueItem {
  if (component.type !== 'NestedValueItem') {
    throw new Error('Expected type = NestedValueItem (but was ' + component.type + ')');
  }
}

export interface AdminStringsValueItemFields {
  normal: string | null;
  required: string | null;
  matchPattern: string | null;
  list: string[] | null;
  requiredList: string[] | null;
  requiredListMatchPattern: string[] | null;
}

export type AdminStringsValueItem = Component<'StringsValueItem', AdminStringsValueItemFields>;

export function isAdminStringsValueItem(
  component: Component<string, object> | AdminStringsValueItem,
): component is AdminStringsValueItem {
  return component.type === 'StringsValueItem';
}

export function assertIsAdminStringsValueItem(
  component: Component<string, object> | AdminStringsValueItem,
): asserts component is AdminStringsValueItem {
  if (component.type !== 'StringsValueItem') {
    throw new Error('Expected type = StringsValueItem (but was ' + component.type + ')');
  }
}
