import type { AdminEntity, EntityReference, ValueItem } from '@jonasb/datadata-core';

export interface AdminPlaceOfBusinessFields {
  name: string | null;
  address: ValueItem | null;
  slogan: string | null;
  description: string | null;
}

export type AdminPlaceOfBusiness = AdminEntity<'PlaceOfBusiness', AdminPlaceOfBusinessFields>;

export interface AdminReviewFields {
  reviewer: EntityReference | null;
  placeOfBusiness: EntityReference | null;
  review: string | null;
}

export type AdminReview = AdminEntity<'Review', AdminReviewFields>;

export interface AdminReviewerFields {
  name: string | null;
}

export type AdminReviewer = AdminEntity<'Reviewer', AdminReviewerFields>;
