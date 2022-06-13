import type { AdminEntity, EntityReference, ValueItem } from '@jonasb/datadata-core';

export interface AdminPlaceOfBusinessFields {
  name: string | null;
  address: ValueItem | null;
  slogan: string | null;
  description: string | null;
}

export type AdminPlaceOfBusiness = AdminEntity<'PlaceOfBusiness', AdminPlaceOfBusinessFields>;

export function isAdminPlaceOfBusiness(
  entity: AdminEntity | AdminPlaceOfBusiness
): entity is AdminPlaceOfBusiness {
  return entity.info.type === 'PlaceOfBusiness';
}

export function assertIsAdminPlaceOfBusiness(
  entity: AdminEntity | AdminPlaceOfBusiness
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

export type AdminReview = AdminEntity<'Review', AdminReviewFields>;

export function isAdminReview(entity: AdminEntity | AdminReview): entity is AdminReview {
  return entity.info.type === 'Review';
}

export function assertIsAdminReview(
  entity: AdminEntity | AdminReview
): asserts entity is AdminReview {
  if (entity.info.type !== 'Review') {
    throw new Error('Expected info.type = Review (but was ' + entity.info.type + ')');
  }
}

export interface AdminReviewerFields {
  name: string | null;
}

export type AdminReviewer = AdminEntity<'Reviewer', AdminReviewerFields>;

export function isAdminReviewer(entity: AdminEntity | AdminReviewer): entity is AdminReviewer {
  return entity.info.type === 'Reviewer';
}

export function assertIsAdminReviewer(
  entity: AdminEntity | AdminReviewer
): asserts entity is AdminReviewer {
  if (entity.info.type !== 'Reviewer') {
    throw new Error('Expected info.type = Reviewer (but was ' + entity.info.type + ')');
  }
}
