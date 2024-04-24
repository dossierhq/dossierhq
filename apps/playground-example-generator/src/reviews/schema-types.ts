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

export type AppUniqueIndexes = never;

export type AppEntity = PersonalNote | PlaceOfBusiness | Review | Reviewer;

export interface PersonalNoteFields {
  note: RichText | null;
  placeOfBusiness: EntityReference | null;
}

export type PersonalNote = Entity<'PersonalNote', PersonalNoteFields, 'subject'>;

export function isPersonalNote(entity: Entity<string, object>): entity is PersonalNote {
  return entity.info.type === 'PersonalNote';
}

export function assertIsPersonalNote(
  entity: Entity<string, object>,
): asserts entity is PersonalNote {
  if (entity.info.type !== 'PersonalNote') {
    throw new Error('Expected info.type = PersonalNote (but was ' + entity.info.type + ')');
  }
}

export interface PlaceOfBusinessFields {
  name: string | null;
  address: Address | null;
  slogan: string | null;
  description: string | null;
}

export type PlaceOfBusiness = Entity<'PlaceOfBusiness', PlaceOfBusinessFields, ''>;

export function isPlaceOfBusiness(entity: Entity<string, object>): entity is PlaceOfBusiness {
  return entity.info.type === 'PlaceOfBusiness';
}

export function assertIsPlaceOfBusiness(
  entity: Entity<string, object>,
): asserts entity is PlaceOfBusiness {
  if (entity.info.type !== 'PlaceOfBusiness') {
    throw new Error('Expected info.type = PlaceOfBusiness (but was ' + entity.info.type + ')');
  }
}

export interface ReviewFields {
  reviewer: EntityReference | null;
  placeOfBusiness: EntityReference | null;
  review: string | null;
}

export type Review = Entity<'Review', ReviewFields, ''>;

export function isReview(entity: Entity<string, object>): entity is Review {
  return entity.info.type === 'Review';
}

export function assertIsReview(entity: Entity<string, object>): asserts entity is Review {
  if (entity.info.type !== 'Review') {
    throw new Error('Expected info.type = Review (but was ' + entity.info.type + ')');
  }
}

export interface ReviewerFields {
  name: string | null;
}

export type Reviewer = Entity<'Reviewer', ReviewerFields, ''>;

export function isReviewer(entity: Entity<string, object>): entity is Reviewer {
  return entity.info.type === 'Reviewer';
}

export function assertIsReviewer(entity: Entity<string, object>): asserts entity is Reviewer {
  if (entity.info.type !== 'Reviewer') {
    throw new Error('Expected info.type = Reviewer (but was ' + entity.info.type + ')');
  }
}

export type AppComponent = Address;

export interface AddressFields {
  location: Location | null;
  line1: string | null;
  line2: string | null;
  zip: string | null;
  city: string | null;
}

export type Address = Component<'Address', AddressFields>;

export function isAddress(component: Component<string, object> | Address): component is Address {
  return component.type === 'Address';
}

export function assertIsAddress(
  component: Component<string, object> | Address,
): asserts component is Address {
  if (component.type !== 'Address') {
    throw new Error('Expected type = Address (but was ' + component.type + ')');
  }
}
