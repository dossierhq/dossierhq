import type {
  AdminEntity,
  ErrorType,
  JsonAdminEntityHistory,
  JsonConnection,
  JsonEdge,
  JsonPublishHistory,
  SchemaSpecification,
} from '@datadata/core';

export interface EntityResponse {
  item: AdminEntity;
}

export type EntityHistoryResponse = JsonAdminEntityHistory;

export type PublishHistoryResponse = JsonPublishHistory;

export interface SchemaResponse {
  spec: SchemaSpecification;
}

export type SearchEntitiesResponse = JsonConnection<JsonEdge<AdminEntity, ErrorType>> | null;

export interface ActionResponse {
  success: boolean;
}
