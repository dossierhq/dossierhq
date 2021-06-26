import type {
  AdminEntity,
  ErrorType,
  JsonConnection,
  JsonEdge,
  JsonEntityHistory,
  JsonPublishingHistory,
  SchemaSpecification,
} from '@datadata/core';

export interface EntityResponse {
  item: AdminEntity;
}

export type EntityHistoryResponse = JsonEntityHistory;

export type PublishingHistoryResponse = JsonPublishingHistory;

export interface SchemaResponse {
  spec: SchemaSpecification;
}

export type SearchEntitiesResponse = JsonConnection<JsonEdge<AdminEntity, ErrorType>> | null;

export interface ActionResponse {
  success: boolean;
}
