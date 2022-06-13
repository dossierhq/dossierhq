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

export interface AdminReviewFields {
  reviewer: EntityReference | null;
  placeOfBusiness: EntityReference | null;
  review: string | null;
}

export type AdminReview = AdminEntity<'Review', AdminReviewFields>;

export function isAdminReview(entity: AdminEntity | AdminReview): entity is AdminReview {
  return entity.info.type === 'Review';
}

export interface AdminReviewerFields {
  name: string | null;
}

export type AdminReviewer = AdminEntity<'Reviewer', AdminReviewerFields>;

export function isAdminReviewer(entity: AdminEntity | AdminReviewer): entity is AdminReviewer {
  return entity.info.type === 'Reviewer';
}
