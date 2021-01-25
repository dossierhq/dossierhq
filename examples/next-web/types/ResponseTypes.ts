import type { AdminEntity, ErrorType, PageInfo, SchemaSpecification } from '@datadata/core';

export interface EntityResponse {
  item: AdminEntity;
}

export interface SchemaResponse {
  spec: SchemaSpecification;
}

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

export type SearchEntitiesResponse = JsonConnection<JsonEdge<AdminEntity, ErrorType>> | null;
