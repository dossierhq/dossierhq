import type {
  AdminClient,
  AdminEntity,
  AdminExceptionClient,
  EntityReference,
  Location,
  RichText,
  ValueItem,
} from '@dossierhq/core';

export type AppAdminClient = AdminClient<
  AppAdminEntity,
  AppAdminUniqueIndexes,
  AppAdminExceptionClient
>;

export type AppAdminExceptionClient = AdminExceptionClient<AppAdminEntity, AppAdminUniqueIndexes>;

export type AppAdminUniqueIndexes = never;

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
}

export type AdminBooleansEntity = AdminEntity<'BooleansEntity', AdminBooleansEntityFields, string>;

export function isAdminBooleansEntity(
  entity: AdminEntity<string, object>
): entity is AdminBooleansEntity {
  return entity.info.type === 'BooleansEntity';
}

export function assertIsAdminBooleansEntity(
  entity: AdminEntity<string, object>
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
  entity: AdminEntity<string, object>
): entity is AdminEntitiesEntity {
  return entity.info.type === 'EntitiesEntity';
}

export function assertIsAdminEntitiesEntity(
  entity: AdminEntity<string, object>
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
  entity: AdminEntity<string, object>
): entity is AdminLocationsEntity {
  return entity.info.type === 'LocationsEntity';
}

export function assertIsAdminLocationsEntity(
  entity: AdminEntity<string, object>
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
  entity: AdminEntity<string, object>
): entity is AdminNumbersEntity {
  return entity.info.type === 'NumbersEntity';
}

export function assertIsAdminNumbersEntity(
  entity: AdminEntity<string, object>
): asserts entity is AdminNumbersEntity {
  if (entity.info.type !== 'NumbersEntity') {
    throw new Error('Expected info.type = NumbersEntity (but was ' + entity.info.type + ')');
  }
}

export interface AdminRichTextsEntityFields {
  normal: RichText | null;
  required: RichText | null;
  minimal: RichText | null;
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
  entity: AdminEntity<string, object>
): entity is AdminRichTextsEntity {
  return entity.info.type === 'RichTextsEntity';
}

export function assertIsAdminRichTextsEntity(
  entity: AdminEntity<string, object>
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
  matchPattern: string | null;
  values: 'bar' | 'baz' | 'foo' | null;
  valuesList: Array<'bar' | 'baz' | 'foo'> | null;
  list: string[] | null;
  requiredList: string[] | null;
  requiredListMatchPattern: string[] | null;
}

export type AdminStringsEntity = AdminEntity<'StringsEntity', AdminStringsEntityFields, string>;

export function isAdminStringsEntity(
  entity: AdminEntity<string, object>
): entity is AdminStringsEntity {
  return entity.info.type === 'StringsEntity';
}

export function assertIsAdminStringsEntity(
  entity: AdminEntity<string, object>
): asserts entity is AdminStringsEntity {
  if (entity.info.type !== 'StringsEntity') {
    throw new Error('Expected info.type = StringsEntity (but was ' + entity.info.type + ')');
  }
}

export interface AdminValueItemsEntityFields {
  normal: AppAdminValueItem | null;
  required: AppAdminValueItem | null;
  list: AppAdminValueItem[] | null;
  requiredList: AppAdminValueItem[] | null;
  adminOnly: AppAdminValueItem | null;
  cloudinaryImage: AdminCloudinaryImage | null;
}

export type AdminValueItemsEntity = AdminEntity<
  'ValueItemsEntity',
  AdminValueItemsEntityFields,
  string
>;

export function isAdminValueItemsEntity(
  entity: AdminEntity<string, object>
): entity is AdminValueItemsEntity {
  return entity.info.type === 'ValueItemsEntity';
}

export function assertIsAdminValueItemsEntity(
  entity: AdminEntity<string, object>
): asserts entity is AdminValueItemsEntity {
  if (entity.info.type !== 'ValueItemsEntity') {
    throw new Error('Expected info.type = ValueItemsEntity (but was ' + entity.info.type + ')');
  }
}

export type AppAdminValueItem = AdminCloudinaryImage | AdminNestedValueItem | AdminStringsValueItem;

export interface AdminCloudinaryImageFields {
  publicId: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
}

export type AdminCloudinaryImage = ValueItem<'CloudinaryImage', AdminCloudinaryImageFields>;

export function isAdminCloudinaryImage(
  valueItem: ValueItem<string, object> | AdminCloudinaryImage
): valueItem is AdminCloudinaryImage {
  return valueItem.type === 'CloudinaryImage';
}

export function assertIsAdminCloudinaryImage(
  valueItem: ValueItem<string, object> | AdminCloudinaryImage
): asserts valueItem is AdminCloudinaryImage {
  if (valueItem.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + valueItem.type + ')');
  }
}

export interface AdminNestedValueItemFields {
  text: string | null;
  child: AdminNestedValueItem | null;
}

export type AdminNestedValueItem = ValueItem<'NestedValueItem', AdminNestedValueItemFields>;

export function isAdminNestedValueItem(
  valueItem: ValueItem<string, object> | AdminNestedValueItem
): valueItem is AdminNestedValueItem {
  return valueItem.type === 'NestedValueItem';
}

export function assertIsAdminNestedValueItem(
  valueItem: ValueItem<string, object> | AdminNestedValueItem
): asserts valueItem is AdminNestedValueItem {
  if (valueItem.type !== 'NestedValueItem') {
    throw new Error('Expected type = NestedValueItem (but was ' + valueItem.type + ')');
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

export type AdminStringsValueItem = ValueItem<'StringsValueItem', AdminStringsValueItemFields>;

export function isAdminStringsValueItem(
  valueItem: ValueItem<string, object> | AdminStringsValueItem
): valueItem is AdminStringsValueItem {
  return valueItem.type === 'StringsValueItem';
}

export function assertIsAdminStringsValueItem(
  valueItem: ValueItem<string, object> | AdminStringsValueItem
): asserts valueItem is AdminStringsValueItem {
  if (valueItem.type !== 'StringsValueItem') {
    throw new Error('Expected type = StringsValueItem (but was ' + valueItem.type + ')');
  }
}
