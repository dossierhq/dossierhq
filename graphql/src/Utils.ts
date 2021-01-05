import type { SessionContext } from '@datadata/server';
import type { SessionGraphQLContext } from '.';

export function getSessionContext<TContext extends SessionGraphQLContext>(
  context: TContext
): SessionContext {
  if (context.context.isError()) {
    throw context.context.toError();
  }
  return context.context.value;
}
