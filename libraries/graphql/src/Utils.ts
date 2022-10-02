import type { AdminClient, PublishedClient } from '@jonasb/datadata-core';
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
