import type {
  AdminEntityHistory,
  AdminEntityVersionInfo,
  Connection,
  Edge,
  ErrorType,
  PageInfo,
  PublishEvent,
  PublishHistory,
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

export interface JsonAdminEntityHistory extends Omit<AdminEntityHistory, 'versions'> {
  versions: JsonAdminEntityVersionInfo[];
}

export interface JsonAdminEntityVersionInfo extends Omit<AdminEntityVersionInfo, 'createdAt'> {
  createdAt: string;
}

export interface JsonPublishHistory extends Omit<PublishHistory, 'events'> {
  events: JsonPublishEvent[];
}

export interface JsonPublishEvent extends Omit<PublishEvent, 'publishedAt'> {
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

export function convertJsonEntityVersion(
  entityVersion: JsonAdminEntityHistory
): AdminEntityHistory {
  return {
    ...entityVersion,
    versions: entityVersion.versions.map((version) => ({
      ...version,
      createdAt: new Date(version.createdAt),
    })),
  };
}

export function convertJsonPublishHistory(publishHistory: JsonPublishHistory): PublishHistory {
  return {
    ...publishHistory,
    events: publishHistory.events.map((version) => ({
      ...version,
      publishedAt: new Date(version.publishedAt),
    })),
  };
}
