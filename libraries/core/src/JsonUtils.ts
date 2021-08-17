import { Temporal } from '@js-temporal/polyfill';
import type {
  Connection,
  Edge,
  EntityHistory,
  EntityPublishPayload,
  EntityVersionInfo,
  ErrorType,
  PageInfo,
  PublishingEvent,
  PublishingHistory,
  Result,
} from '.';
import { createErrorResult, ok } from '.';

export interface JsonConnection<T extends JsonEdge<unknown, ErrorType>> {
  pageInfo: PageInfo;
  edges: T[];
}

export interface JsonEdge<TOk, TError extends ErrorType> {
  node: JsonResult<TOk, TError>;
  cursor: string;
}

export type JsonResult<TOk, TError extends ErrorType> =
  | { value: TOk }
  | { error: TError; message: string };

export interface JsonPublishingResult extends Omit<EntityPublishPayload, 'updatedAt'> {
  updatedAt: string;
}

export interface JsonEntityHistory extends Omit<EntityHistory, 'versions'> {
  versions: JsonEntityVersionInfo[];
}

export interface JsonEntityVersionInfo extends Omit<EntityVersionInfo, 'createdAt'> {
  createdAt: string;
}

export interface JsonPublishingHistory extends Omit<PublishingHistory, 'events'> {
  events: JsonPublishingEvent[];
}

export interface JsonPublishingEvent extends Omit<PublishingEvent, 'publishedAt'> {
  publishedAt: string;
}

export function convertJsonConnection<
  TIn extends JsonEdge<unknown, ErrorType>,
  TOut extends Edge<unknown, ErrorType>
>(
  jsonConnection: JsonConnection<TIn> | null,
  edgeConverter: (edge: TIn) => TOut
): Connection<TOut> | null {
  if (!jsonConnection) {
    return null;
  }
  return { pageInfo: jsonConnection.pageInfo, edges: jsonConnection.edges.map(edgeConverter) };
}

export function convertJsonEdge<TOk, TError extends ErrorType>(
  jsonEdge: JsonEdge<TOk, TError>
): Edge<TOk, TError> {
  return { node: convertJsonResult(jsonEdge.node), cursor: jsonEdge.cursor };
}

export function convertJsonResult<TOk, TError extends ErrorType>(
  jsonResult: JsonResult<TOk, TError>
): Result<TOk, TError> {
  if ('value' in jsonResult) {
    return ok(jsonResult.value);
  }
  return createErrorResult(jsonResult.error, jsonResult.message);
}

export function convertJsonPublishingResult(
  publishingResult: JsonPublishingResult
): EntityPublishPayload {
  return {
    ...publishingResult,
    updatedAt: Temporal.Instant.from(publishingResult.updatedAt),
  };
}

export function convertJsonEntityHistory(entityHistory: JsonEntityHistory): EntityHistory {
  return {
    ...entityHistory,
    versions: entityHistory.versions.map((version) => ({
      ...version,
      createdAt: Temporal.Instant.from(version.createdAt),
    })),
  };
}

export function convertJsonPublishingHistory(
  publishingHistory: JsonPublishingHistory
): PublishingHistory {
  return {
    ...publishingHistory,
    events: publishingHistory.events.map((version) => ({
      ...version,
      publishedAt: Temporal.Instant.from(version.publishedAt),
    })),
  };
}
