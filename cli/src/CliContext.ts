import type { AdminClient, PublishedClient, Schema } from '@datadata/core';

export interface CliContext {
  schema: Schema;
  adminClient: AdminClient;
  publishedClient: PublishedClient;
}
