import { Auth, ErrorType, Instance, Schema } from '.';
import type { OkResult, Result, SchemaSpecification, SessionContext } from '.';

export async function createTestInstance(): Promise<Instance> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const instance = new Instance({ databaseUrl: process.env.DATABASE_URL! });
  return instance;
}

export async function ensureSessionContext(
  instance: Instance,
  provider: string,
  identifier: string
): Promise<SessionContext> {
  const authContext = instance.createAuthContext();
  const sessionResult = await Auth.createSessionForPrincipal(authContext, provider, identifier);
  if (sessionResult.isOk()) {
    return instance.createSessionContext(sessionResult.value);
  }

  expectErrorResult(sessionResult, ErrorType.NotFound, 'Principal doesn’t exist');

  const createResult = await Auth.createPrincipal(authContext, provider, identifier);
  createResult.throwIfError();

  const sessionResult2 = await Auth.createSessionForPrincipal(authContext, provider, identifier);
  if (sessionResult2.isError()) {
    throw sessionResult2.toError();
  }

  return instance.createSessionContext(sessionResult2.value);
}

export async function updateSchema(
  context: SessionContext,
  newSchemaSpec: Partial<SchemaSpecification>
): Promise<void> {
  let oldSchemaSpec: SchemaSpecification = { entityTypes: [], valueTypes: [] };
  try {
    await context.instance.reloadSchema(context);
    oldSchemaSpec = context.instance.getSchema().spec;
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
  const result = await context.instance.setSchema(context, newSchema);
  result.throwIfError();
}

export function expectOkResult<TOk, TError extends ErrorType>(
  actual: Result<unknown, ErrorType>
): actual is OkResult<TOk, TError> {
  if (actual.isError()) {
    throw new Error(`Expected ok, got error ${actual.error}: ${actual.message}`);
  }
  return true;
}

export function expectErrorResult(
  actual: Result<unknown, ErrorType>,
  expectedErrorType: ErrorType,
  expectedMessage: string
): void {
  if (!actual.isError()) {
    throw new Error(`Expected error, but was ok`);
  }
  const expectedString = `${expectedErrorType}: ${expectedMessage}`;
  const actualString = `${actual.error}: ${actual.message}`;
  if (actualString !== expectedString) {
    throw new Error(`Expected (${expectedString}), got ${actualString}`);
  }
}
