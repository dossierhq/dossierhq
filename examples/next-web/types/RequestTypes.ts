import type {
  AdminClientJsonOperation,
  AdminEntityCreate,
  AdminEntityUpdate,
  EntityVersionReference,
} from '@jonasb/datadata-core';

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

export type AdminOperationRequest = AdminClientJsonOperation;
