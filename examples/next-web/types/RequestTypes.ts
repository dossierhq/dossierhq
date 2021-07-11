import type { AdminEntityCreate, AdminEntityUpdate, EntityVersionReference } from '@datadata/core';

export interface EntityCreateRequest {
  item: AdminEntityCreate;
}

export interface EntityUpdateRequest {
  item: AdminEntityUpdate;
}

export interface EntityPublishRequest {
  items: EntityVersionReference[];
}

export interface EntityUnpublishRequest {
  items: string[];
}

export type EntityArchiveRequest = Record<never, never>;

export type EntityUnarchiveRequest = Record<never, never>;
