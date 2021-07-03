import type {
  AdminEntity2,
  ErrorType,
  JsonConnection,
  JsonEdge,
  JsonEntityHistory,
  JsonPublishingHistory,
  PublishingResult,
  SchemaSpecification,
} from '@datadata/core';

export interface EntityResponse {
  item: AdminEntity2;
}

export type EntityHistoryResponse = JsonEntityHistory;

export type PublishingHistoryResponse = JsonPublishingHistory;

export interface SchemaResponse {
  spec: SchemaSpecification;
}

export type SearchEntitiesResponse = JsonConnection<JsonEdge<AdminEntity2, ErrorType>> | null;

export type PublishingResultResponse = PublishingResult;
export type PublishingResultListResponse = PublishingResult[];
