export interface Entity {
  id: string;
  _type: string;
  _name: string;
  [fieldName: string]: unknown;
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
