import { assertIsDefined } from '@jonasb/datadata-core';
import type { Session } from '@jonasb/datadata-database-adapter';

const sessionWeakMap = new WeakMap<Session, number>();

export function createSession({
  subjectId,
  subjectInternalId,
}: {
  subjectId: string;
  subjectInternalId: number;
}): Readonly<Session> {
  const session: Readonly<Session> = Object.freeze({ subjectId });
  sessionWeakMap.set(session, subjectInternalId);
  return session;
}

export function getSessionSubjectInternalId(session: Readonly<Session>): number {
  const subjectInternalId = sessionWeakMap.get(session);
  assertIsDefined(subjectInternalId);
  return subjectInternalId;
}
