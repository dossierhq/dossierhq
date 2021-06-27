import type { AdminClient, Schema } from '@datadata/core';
import type { SessionContext } from '@datadata/server';

export interface CliContext {
  schema: Schema;
  context: SessionContext;
  adminClient: AdminClient;
}
