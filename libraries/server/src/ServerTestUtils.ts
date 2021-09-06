import type { Logger, SchemaSpecification } from '@jonasb/datadata-core';
import { Schema } from '@jonasb/datadata-core';
import type { Context, DatabaseAdapter, SessionContext, Transaction } from '.';
import { Auth, Server } from '.';
import { ContextImpl } from './Context';

class DummyContextImpl extends ContextImpl<Context> {
  constructor(
    server: Server,
    databaseAdapter: DatabaseAdapter,
    logger: Logger,
    transaction: Transaction | null
  ) {
    super(server, databaseAdapter, logger, transaction);
  }

  protected copyWithNewTransaction(transaction: Transaction): Context {
    return new DummyContextImpl(this.server, this.databaseAdapter, this.logger, transaction);
  }
}

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

export function createDummyContext(
  server: Server,
  databaseAdapter: DatabaseAdapter,
  logger?: Logger
): Context {
  return new DummyContextImpl(server, databaseAdapter, logger ?? createMockLogger(), null);
}

export function createMockLogger(): Logger {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}
