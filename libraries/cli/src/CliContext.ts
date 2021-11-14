import type { AdminClient, PublishedClient, AdminSchema } from '@jonasb/datadata-core';

export interface CliContext {
  schema: AdminSchema;
  adminClient: AdminClient;
  publishedClient: PublishedClient;
}
