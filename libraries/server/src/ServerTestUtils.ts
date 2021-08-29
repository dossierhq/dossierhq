import type { SchemaSpecification } from '@jonasb/datadata-core';
import { Schema } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter-core';
import type { SessionContext } from '.';
import { Auth, Server } from '.';

export async function createTestServer(databaseAdapter: DatabaseAdapter): Promise<Server> {
  const server = new Server({ databaseAdapter });
  return server;
}

export async function ensureSessionContext(
  server: Server,
  provider: string,
  identifier: string
): Promise<SessionContext> {
  const authContext = server.createAuthContext();
  const sessionResult = await Auth.createSessionForPrincipal(authContext, provider, identifier, {
    createPrincipalIfMissing: true,
  });
  if (sessionResult.isOk()) {
    return server.createSessionContext(sessionResult.value);
  }

  throw sessionResult.toError();
}

export async function updateSchema(
  context: SessionContext,
  newSchemaSpec: Partial<SchemaSpecification>
): Promise<void> {
  let oldSchemaSpec: SchemaSpecification = { entityTypes: [], valueTypes: [] };
  try {
    await context.server.reloadSchema(context);
    oldSchemaSpec = context.server.getSchema().spec;
  } catch (error) {
    // TODO ensure it's due to no schema existing
  }
  const spec: SchemaSpecification = {
    ...oldSchemaSpec,
    ...newSchemaSpec,
    entityTypes: [...oldSchemaSpec.entityTypes],
    valueTypes: [...oldSchemaSpec.valueTypes],
  };

  for (const entitySpec of newSchemaSpec.entityTypes ?? []) {
    const existingIndex = spec.entityTypes.findIndex((x) => x.name === entitySpec.name);
    if (existingIndex >= 0) {
      spec.entityTypes[existingIndex] = entitySpec;
    } else {
      spec.entityTypes.push(entitySpec);
    }
  }
  for (const valueSpec of newSchemaSpec.valueTypes ?? []) {
    const existingIndex = spec.valueTypes.findIndex((x) => x.name === valueSpec.name);
    if (existingIndex >= 0) {
      spec.valueTypes[existingIndex] = valueSpec;
    } else {
      spec.valueTypes.push(valueSpec);
    }
  }

  const newSchema = new Schema(spec);
  const result = await context.server.setSchema(context, newSchema);
  result.throwIfError();
}
