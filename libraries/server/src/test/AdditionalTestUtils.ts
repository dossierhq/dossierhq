import type { SchemaSpecification } from '@jonasb/datadata-core';
import { Schema } from '@jonasb/datadata-core';
import type { SessionContext } from '..';

export function createMockSessionContext({
  schema,
}: {
  schema?: SchemaSpecification;
} = {}): SessionContext {
  const actualSchema = new Schema(schema ?? { entityTypes: [], valueTypes: [] });
  return {
    server: { getSchema: () => actualSchema },
  } as unknown as SessionContext; //TODO
}
