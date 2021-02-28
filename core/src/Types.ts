import type { ErrorType, Result } from '.';

export interface Entity {
  id: string;
  _type: string;
  _name: string;
  [fieldName: string]: unknown;
}

export interface EntityReference {
  id: string;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  bottomLeft: Location;
  topRight: Location;
}

//TODO rename to ValueItem
export interface Value {
  _type: string;
  [fieldName: string]: unknown;
}

export interface AdminEntity {
  /** UUIDv4 */
  id: string;
  _name: string;
  _type: string;
  _version: number;
  _deleted?: boolean;
  [fieldName: string]: unknown;
}

export interface AdminEntityCreate {
  // /** UUIDv4 */
  //TODO  id?: string;
  _name: string;
  _type: string;
  [fieldName: string]: unknown;
}

export interface AdminEntityUpdate {
  /** UUIDv4 */
  id: string;
  _name?: string;
  /** If provided, has to be same as the entity's existing type, i.e. there's no way to change the type of an entity */
  _type?: string;
  [fieldName: string]: unknown;
}

export interface AdminQuery {
  entityTypes?: string[];
  /** Entities referencing the entity (by id) */
  referencing?: string;
  /** Valid values: _name */
  order?: string;
  boundingBox?: BoundingBox;
}

export interface Paging {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export interface PageInfo {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor: string;
  endCursor: string;
}

export interface Connection<T extends Edge<unknown, ErrorType>> {
  pageInfo: PageInfo;
  edges: T[];
}

export interface Edge<TOk, TError extends ErrorType> {
  node: Result<TOk, TError>;
  cursor: string;
}
