import type { AdminClient, PublishedClient, AdminSchema } from '@jonasb/datadata-core';
import type { SessionGraphQLContext } from '.';

export function getSchema<TContext extends SessionGraphQLContext>(context: TContext): AdminSchema {
  if (context.schema.isError()) {
    throw context.schema.toError();
  }
  return context.schema.value;
}

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
