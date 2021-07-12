import type {
  AdminEntity,
  ErrorType,
  JsonConnection,
  JsonEdge,
  JsonEntityHistory,
  JsonPublishingHistory,
  PublishingResult,
  SchemaSpecification,
} from '@jonasb/datadata-core';

export interface EntityResponse {
  item: AdminEntity;
}

export type EntityHistoryResponse = JsonEntityHistory;

export type PublishingHistoryResponse = JsonPublishingHistory;

export interface SchemaResponse {
  spec: SchemaSpecification;
}

export type SearchEntitiesResponse = JsonConnection<JsonEdge<AdminEntity, ErrorType>> | null;
export type TotalCountResponse = { totalCount: number };

export type PublishingResultResponse = PublishingResult;
export type PublishingResultListResponse = PublishingResult[];
