// TODO freeze? seal? WeakMap?
export interface Session {
  //TODO remove subjectInternalId
  readonly subjectInternalId: number;
  /** UUID */
  readonly subjectId: string;
}

export interface ResolvedAuthKey {
  authKey: string;
  resolvedAuthKey: string;
}
