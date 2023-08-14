import type { ErrorType, Result } from '../ErrorResult.js';
import { createErrorResult, ok } from '../ErrorResult.js';
import type {
  AdminEntity,
  AdminEntityCreatePayload,
  AdminEntityInfo,
  AdminEntityPublishingPayload,
  AdminEntityUpdatePayload,
  AdminEntityUpsertPayload,
  Connection,
  Edge,
  EntityHistory,
  EntityVersionInfo,
  PageInfo,
  PublishedEntity,
  PublishedEntityInfo,
  PublishingEvent,
  PublishingHistory,
} from '../Types.js';
import type { ChangelogEvent } from '../events/EventTypes.js';

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

export interface JsonAdminEntityInfo extends Omit<AdminEntityInfo, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export interface JsonAdminEntity extends Omit<AdminEntity, 'info'> {
  info: JsonAdminEntityInfo;
}

export interface JsonPublishedEntityInfo extends Omit<PublishedEntityInfo, 'createdAt'> {
  createdAt: string;
}

export interface JsonPublishedEntity extends Omit<PublishedEntity, 'info'> {
  info: JsonPublishedEntityInfo;
}

export interface JsonAdminEntityCreatePayload extends Omit<AdminEntityCreatePayload, 'entity'> {
  entity: JsonAdminEntity;
}

export interface JsonAdminEntityUpdatePayload extends Omit<AdminEntityUpdatePayload, 'entity'> {
  entity: JsonAdminEntity;
}

export interface JsonAdminEntityUpsertPayload extends Omit<AdminEntityUpsertPayload, 'entity'> {
  entity: JsonAdminEntity;
}

export interface JsonPublishingResult<TEffect>
  extends Omit<AdminEntityPublishingPayload<TEffect>, 'updatedAt'> {
  updatedAt: string;
}

export interface JsonChangelogEvent extends Omit<ChangelogEvent, 'createdAt'> {
  createdAt: string;
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
  TOut extends Edge<unknown, ErrorType>,
>(
  jsonConnection: JsonConnection<TIn> | null,
  edgeConverter: (edge: TIn) => TOut,
): Connection<TOut> | null {
  if (!jsonConnection) {
    return null;
  }
  return { pageInfo: jsonConnection.pageInfo, edges: jsonConnection.edges.map(edgeConverter) };
}

export function convertJsonEdge<TOkIn, TOkOut, TError extends ErrorType>(
  jsonEdge: JsonEdge<TOkIn, TError>,
  nodeConverter: (node: TOkIn) => TOkOut,
): Edge<TOkOut, TError> {
  const nodeJson = convertJsonResult(jsonEdge.node);
  const node: Result<TOkOut, TError> = nodeJson.isOk() ? nodeJson.map(nodeConverter) : nodeJson;
  return { node, cursor: jsonEdge.cursor };
}

export function convertJsonResult<TOk, TError extends ErrorType>(
  jsonResult: JsonResult<TOk, TError>,
): Result<TOk, TError> {
  if ('value' in jsonResult) {
    return ok(jsonResult.value);
  }
  return createErrorResult(jsonResult.error, jsonResult.message);
}

export function convertJsonAdminEntity(entity: JsonAdminEntity): AdminEntity {
  return {
    ...entity,
    info: {
      ...entity.info,
      createdAt: new Date(entity.info.createdAt),
      updatedAt: new Date(entity.info.updatedAt),
    },
  };
}

export function convertJsonPublishedEntity(entity: JsonPublishedEntity): PublishedEntity {
  return {
    ...entity,
    info: {
      ...entity.info,
      createdAt: new Date(entity.info.createdAt),
    },
  };
}

export function convertJsonPublishingResult<TEffect>(
  publishingResult: JsonPublishingResult<TEffect>,
): AdminEntityPublishingPayload<TEffect> {
  return {
    ...publishingResult,
    updatedAt: new Date(publishingResult.updatedAt),
  };
}

export function convertJsonChangelogEventEdge<TError extends ErrorType>(
  edge: JsonEdge<JsonChangelogEvent, TError>,
): Edge<ChangelogEvent, TError> {
  return convertJsonEdge(edge, (node) => ({ ...node, createdAt: new Date(node.createdAt) }));
}

export function convertJsonEntityHistory(entityHistory: JsonEntityHistory): EntityHistory {
  return {
    ...entityHistory,
    versions: entityHistory.versions.map((version) => ({
      ...version,
      createdAt: new Date(version.createdAt),
    })),
  };
}

export function convertJsonPublishingHistory(
  publishingHistory: JsonPublishingHistory,
): PublishingHistory {
  return {
    ...publishingHistory,
    events: publishingHistory.events.map((version) => ({
      ...version,
      publishedAt: new Date(version.publishedAt),
    })),
  };
}
