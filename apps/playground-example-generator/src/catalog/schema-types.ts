import type {
  AdminExceptionClient,
  Component,
  DossierClient,
  Entity,
  EntityReference,
  Location,
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

export type AppUniqueIndexes = 'slug';

export type AppEntity =
  | BooleansEntity
  | ComponentsEntity
  | LocationsEntity
  | NumbersEntity
  | ReferencesEntity
  | RichTextsEntity
  | StringsEntity;

export interface BooleansEntityFields {
  normal: boolean | null;
  required: boolean | null;
  list: boolean[] | null;
}

export type BooleansEntity = Entity<'BooleansEntity', BooleansEntityFields, ''>;

export function isBooleansEntity(entity: Entity<string, object>): entity is BooleansEntity {
  return entity.info.type === 'BooleansEntity';
}

export function assertIsBooleansEntity(
  entity: Entity<string, object>,
): asserts entity is BooleansEntity {
  if (entity.info.type !== 'BooleansEntity') {
    throw new Error('Expected info.type = BooleansEntity (but was ' + entity.info.type + ')');
  }
}

export interface ComponentsEntityFields {
  normal: AppComponent | null;
  required: AppComponent | null;
  list: AppComponent[] | null;
  requiredList: AppComponent[] | null;
  adminOnly: AppComponent | null;
  cloudinaryImage: CloudinaryImage | null;
}

export type ComponentsEntity = Entity<'ComponentsEntity', ComponentsEntityFields, ''>;

export function isComponentsEntity(entity: Entity<string, object>): entity is ComponentsEntity {
  return entity.info.type === 'ComponentsEntity';
}

export function assertIsComponentsEntity(
  entity: Entity<string, object>,
): asserts entity is ComponentsEntity {
  if (entity.info.type !== 'ComponentsEntity') {
    throw new Error('Expected info.type = ComponentsEntity (but was ' + entity.info.type + ')');
  }
}

export interface LocationsEntityFields {
  normal: Location | null;
  required: Location | null;
  list: Location[] | null;
  requiredList: Location[] | null;
}

export type LocationsEntity = Entity<'LocationsEntity', LocationsEntityFields, ''>;

export function isLocationsEntity(entity: Entity<string, object>): entity is LocationsEntity {
  return entity.info.type === 'LocationsEntity';
}

export function assertIsLocationsEntity(
  entity: Entity<string, object>,
): asserts entity is LocationsEntity {
  if (entity.info.type !== 'LocationsEntity') {
    throw new Error('Expected info.type = LocationsEntity (but was ' + entity.info.type + ')');
  }
}

export interface NumbersEntityFields {
  normal: number | null;
  required: number | null;
  integer: number | null;
  list: number[] | null;
  requiredList: number[] | null;
  requiredIntegerList: number[] | null;
}

export type NumbersEntity = Entity<'NumbersEntity', NumbersEntityFields, ''>;

export function isNumbersEntity(entity: Entity<string, object>): entity is NumbersEntity {
  return entity.info.type === 'NumbersEntity';
}

export function assertIsNumbersEntity(
  entity: Entity<string, object>,
): asserts entity is NumbersEntity {
  if (entity.info.type !== 'NumbersEntity') {
    throw new Error('Expected info.type = NumbersEntity (but was ' + entity.info.type + ')');
  }
}

export interface ReferencesEntityFields {
  normal: EntityReference | null;
  required: EntityReference | null;
  list: EntityReference[] | null;
  stringsEntity: EntityReference | null;
  stringsEntityList: EntityReference[] | null;
  stringsAndLocationsEntity: EntityReference | null;
  stringsAndLocationsEntityList: EntityReference[] | null;
}

export type ReferencesEntity = Entity<'ReferencesEntity', ReferencesEntityFields, ''>;

export function isReferencesEntity(entity: Entity<string, object>): entity is ReferencesEntity {
  return entity.info.type === 'ReferencesEntity';
}

export function assertIsReferencesEntity(
  entity: Entity<string, object>,
): asserts entity is ReferencesEntity {
  if (entity.info.type !== 'ReferencesEntity') {
    throw new Error('Expected info.type = ReferencesEntity (but was ' + entity.info.type + ')');
  }
}

export interface RichTextsEntityFields {
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

export type RichTextsEntity = Entity<'RichTextsEntity', RichTextsEntityFields, ''>;

export function isRichTextsEntity(entity: Entity<string, object>): entity is RichTextsEntity {
  return entity.info.type === 'RichTextsEntity';
}

export function assertIsRichTextsEntity(
  entity: Entity<string, object>,
): asserts entity is RichTextsEntity {
  if (entity.info.type !== 'RichTextsEntity') {
    throw new Error('Expected info.type = RichTextsEntity (but was ' + entity.info.type + ')');
  }
}

export interface StringsEntityFields {
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

export type StringsEntity = Entity<'StringsEntity', StringsEntityFields, ''>;

export function isStringsEntity(entity: Entity<string, object>): entity is StringsEntity {
  return entity.info.type === 'StringsEntity';
}

export function assertIsStringsEntity(
  entity: Entity<string, object>,
): asserts entity is StringsEntity {
  if (entity.info.type !== 'StringsEntity') {
    throw new Error('Expected info.type = StringsEntity (but was ' + entity.info.type + ')');
  }
}

export type AppComponent =
  | AdminOnlyComponent
  | CloudinaryImage
  | NestedComponent
  | StringsComponent;

export interface AdminOnlyComponentFields {
  text: string | null;
}

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

export interface CloudinaryImageFields {
  publicId: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
}

export type CloudinaryImage = Component<'CloudinaryImage', CloudinaryImageFields>;

export function isCloudinaryImage(
  component: Component<string, object> | CloudinaryImage,
): component is CloudinaryImage {
  return component.type === 'CloudinaryImage';
}

export function assertIsCloudinaryImage(
  component: Component<string, object> | CloudinaryImage,
): asserts component is CloudinaryImage {
  if (component.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + component.type + ')');
  }
}

export interface NestedComponentFields {
  text: string | null;
  child: NestedComponent | null;
}

export type NestedComponent = Component<'NestedComponent', NestedComponentFields>;

export function isNestedComponent(
  component: Component<string, object> | NestedComponent,
): component is NestedComponent {
  return component.type === 'NestedComponent';
}

export function assertIsNestedComponent(
  component: Component<string, object> | NestedComponent,
): asserts component is NestedComponent {
  if (component.type !== 'NestedComponent') {
    throw new Error('Expected type = NestedComponent (but was ' + component.type + ')');
  }
}

export interface StringsComponentFields {
  normal: string | null;
  required: string | null;
  matchPattern: string | null;
  list: string[] | null;
  requiredList: string[] | null;
  requiredListMatchPattern: string[] | null;
}

export type StringsComponent = Component<'StringsComponent', StringsComponentFields>;

export function isStringsComponent(
  component: Component<string, object> | StringsComponent,
): component is StringsComponent {
  return component.type === 'StringsComponent';
}

export function assertIsStringsComponent(
  component: Component<string, object> | StringsComponent,
): asserts component is StringsComponent {
  if (component.type !== 'StringsComponent') {
    throw new Error('Expected type = StringsComponent (but was ' + component.type + ')');
  }
}
