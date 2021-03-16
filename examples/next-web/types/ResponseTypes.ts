import type {
  AdminEntity,
  ErrorType,
  JsonAdminEntityHistory,
  JsonConnection,
  JsonEdge,
  SchemaSpecification,
} from '@datadata/core';

export interface EntityResponse {
  item: AdminEntity;
}

export type EntityHistoryResponse = JsonAdminEntityHistory;

export interface SchemaResponse {
  spec: SchemaSpecification;
}

export type SearchEntitiesResponse = JsonConnection<JsonEdge<AdminEntity, ErrorType>> | null;

export interface ActionResponse {
  success: boolean;
}
