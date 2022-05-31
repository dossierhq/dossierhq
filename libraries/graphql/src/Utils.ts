import type { AdminClient, PublishedClient } from '@jonasb/datadata-core';
import type { Temporal } from '@js-temporal/polyfill';
import type { SessionGraphQLContext } from './GraphQLSchemaGenerator.js';

export function getAdminClient<TContext extends SessionGraphQLContext>(
  context: TContext
): AdminClient {
  if (context.adminClient.isError()) {
    throw context.adminClient.toError();
  }
  return context.adminClient.value;
}

export function getPublishedClient<TContext extends SessionGraphQLContext>(
  context: TContext
): PublishedClient {
  if (context.publishedClient.isError()) {
    throw context.publishedClient.toError();
  }
  return context.publishedClient.value;
}

// Next.js messes up instanceof, so use do a "weak" instanceof check
export function seemsLikeATemporalInstant(value: unknown): value is Temporal.Instant {
  return !!(value && typeof value === 'object' && value.constructor.name === 'Instant');
}
