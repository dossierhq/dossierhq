import type {
  AdminEntity,
  ErrorType,
  JsonConnection,
  JsonEdge,
  SchemaSpecification,
} from '@datadata/core';

export interface EntityResponse {
  item: AdminEntity;
}

export interface SchemaResponse {
  spec: SchemaSpecification;
}

export type SearchEntitiesResponse = JsonConnection<JsonEdge<AdminEntity, ErrorType>> | null;
