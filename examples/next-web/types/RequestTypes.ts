import type { AdminEntityCreate, AdminEntityUpdate } from '@datadata/core';

export interface EntityCreateRequest {
  item: AdminEntityCreate;
}

export interface EntityUpdateRequest {
  item: AdminEntityUpdate;
}
