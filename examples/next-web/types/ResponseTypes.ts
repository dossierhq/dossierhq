import type { AdminEntity, SchemaSpecification } from '@datadata/core';

export interface EntityResponse {
  item: AdminEntity;
}

export interface SchemaResponse {
  spec: SchemaSpecification;
}
