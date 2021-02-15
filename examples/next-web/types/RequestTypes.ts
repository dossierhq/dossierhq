import type { AdminEntityCreate, AdminEntityUpdate } from '@datadata/core';

export interface EntityCreateRequest {
  item: AdminEntityCreate;
  options: { publish: boolean };
}

export interface EntityUpdateRequest {
  item: AdminEntityUpdate;
  options: { publish: boolean };
}
