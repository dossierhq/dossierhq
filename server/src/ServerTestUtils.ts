import { CoreTestUtils, ErrorType, Schema } from '@datadata/core';
import type { SchemaSpecification } from '@datadata/core';
import { Auth, Server } from '.';
import type { SessionContext } from '.';

const { expectErrorResult } = CoreTestUtils;

export async function createTestServer(): Promise<Server> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const server = new Server({ databaseUrl: process.env.DATABASE_URL! });
  return server;
}

export async function ensureSessionContext(
  server: Server,
  provider: string,
  identifier: string
): Promise<SessionContext> {
  const authContext = server.createAuthContext();
  const sessionResult = await Auth.createSessionForPrincipal(authContext, provider, identifier);
  if (sessionResult.isOk()) {
    return server.createSessionContext(sessionResult.value);
  }

  expectErrorResult(sessionResult, ErrorType.NotFound, 'Principal doesn’t exist');

  const createResult = await Auth.createPrincipal(authContext, provider, identifier);
  createResult.throwIfError();

  const sessionResult2 = await Auth.createSessionForPrincipal(authContext, provider, identifier);
  if (sessionResult2.isError()) {
    throw sessionResult2.toError();
  }

  return server.createSessionContext(sessionResult2.value);
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
