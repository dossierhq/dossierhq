export type Session = WriteSession | ReadOnlySession;

export interface WriteSession {
  type: 'write';
  /** UUID */
  readonly subjectId: string;
}

export interface ReadOnlySession {
  type: 'readonly';
  /** UUID, null if the principal/subject exists */
  readonly subjectId: string | null;
}

export interface ResolvedAuthKey {
  authKey: string;
  resolvedAuthKey: string;
}
