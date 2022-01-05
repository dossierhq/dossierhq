export interface Session {
  /** UUID */
  readonly subjectId: string;
}

export interface ResolvedAuthKey {
  authKey: string;
  resolvedAuthKey: string;
}
