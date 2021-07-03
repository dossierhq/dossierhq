import type { AdminEntityCreate2, AdminEntityUpdate2 } from '@datadata/core';

export interface EntityCreateRequest {
  item: AdminEntityCreate2;
}

export interface EntityUpdateRequest {
  item: AdminEntityUpdate2;
}

export interface EntityPublishRequest {
  items: { id: string; version: number }[];
}

export interface EntityUnpublishRequest {
  items: string[];
}

export type EntityArchiveRequest = Record<never, never>;

export type EntityUnarchiveRequest = Record<never, never>;
