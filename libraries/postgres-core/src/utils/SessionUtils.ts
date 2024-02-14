import type { Session } from '@dossierhq/database-adapter';
import { assertIsDefined } from './AssertUtils.js';

const sessionWeakMap = new WeakMap<Session, number>();

export function createSession<TSession extends Session = Session>({
  session,
  subjectInternalId,
}: {
  session: TSession;
  subjectInternalId: number;
}): Readonly<TSession> {
  const frozenSession = Object.freeze({ ...session }) as Readonly<TSession>;
  sessionWeakMap.set(frozenSession as Session, subjectInternalId);
  return frozenSession;
}

export function getSessionSubjectInternalId(session: Readonly<Session>): number {
  const subjectInternalId = sessionWeakMap.get(session);
  assertIsDefined(subjectInternalId);
  return subjectInternalId;
}
