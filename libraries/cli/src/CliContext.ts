import type { AdminClient, PublishedClient, Schema } from '@jonasb/datadata-core';

export interface CliContext {
  schema: Schema;
  adminClient: AdminClient;
  publishedClient: PublishedClient;
}
