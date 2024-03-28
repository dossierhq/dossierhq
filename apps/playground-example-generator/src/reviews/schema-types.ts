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

export type AppAdminUniqueIndexes = never;

export type AppAdminEntity = AdminPersonalNote | AdminPlaceOfBusiness | AdminReview | AdminReviewer;

export interface AdminPersonalNoteFields {
  note: RichText | null;
  placeOfBusiness: EntityReference | null;
}

export type AdminPersonalNote = AdminEntity<'PersonalNote', AdminPersonalNoteFields, 'subject'>;

export function isAdminPersonalNote(
  entity: AdminEntity<string, object>,
): entity is AdminPersonalNote {
  return entity.info.type === 'PersonalNote';
}

export function assertIsAdminPersonalNote(
  entity: AdminEntity<string, object>,
): asserts entity is AdminPersonalNote {
  if (entity.info.type !== 'PersonalNote') {
    throw new Error('Expected info.type = PersonalNote (but was ' + entity.info.type + ')');
  }
}

export interface AdminPlaceOfBusinessFields {
  name: string | null;
  address: AdminAddress | null;
  slogan: string | null;
  description: string | null;
}

export type AdminPlaceOfBusiness = AdminEntity<'PlaceOfBusiness', AdminPlaceOfBusinessFields, ''>;

export function isAdminPlaceOfBusiness(
  entity: AdminEntity<string, object>,
): entity is AdminPlaceOfBusiness {
  return entity.info.type === 'PlaceOfBusiness';
}

export function assertIsAdminPlaceOfBusiness(
  entity: AdminEntity<string, object>,
): asserts entity is AdminPlaceOfBusiness {
  if (entity.info.type !== 'PlaceOfBusiness') {
    throw new Error('Expected info.type = PlaceOfBusiness (but was ' + entity.info.type + ')');
  }
}

export interface AdminReviewFields {
  reviewer: EntityReference | null;
  placeOfBusiness: EntityReference | null;
  review: string | null;
}

export type AdminReview = AdminEntity<'Review', AdminReviewFields, ''>;

export function isAdminReview(entity: AdminEntity<string, object>): entity is AdminReview {
  return entity.info.type === 'Review';
}

export function assertIsAdminReview(
  entity: AdminEntity<string, object>,
): asserts entity is AdminReview {
  if (entity.info.type !== 'Review') {
    throw new Error('Expected info.type = Review (but was ' + entity.info.type + ')');
  }
}

export interface AdminReviewerFields {
  name: string | null;
}

export type AdminReviewer = AdminEntity<'Reviewer', AdminReviewerFields, ''>;

export function isAdminReviewer(entity: AdminEntity<string, object>): entity is AdminReviewer {
  return entity.info.type === 'Reviewer';
}

export function assertIsAdminReviewer(
  entity: AdminEntity<string, object>,
): asserts entity is AdminReviewer {
  if (entity.info.type !== 'Reviewer') {
    throw new Error('Expected info.type = Reviewer (but was ' + entity.info.type + ')');
  }
}

export type AppAdminComponent = AdminAddress;

export interface AdminAddressFields {
  location: Location | null;
  line1: string | null;
  line2: string | null;
  zip: string | null;
  city: string | null;
}

export type AdminAddress = Component<'Address', AdminAddressFields>;

export function isAdminAddress(
  component: Component<string, object> | AdminAddress,
): component is AdminAddress {
  return component.type === 'Address';
}

export function assertIsAdminAddress(
  component: Component<string, object> | AdminAddress,
): asserts component is AdminAddress {
  if (component.type !== 'Address') {
    throw new Error('Expected type = Address (but was ' + component.type + ')');
  }
}
