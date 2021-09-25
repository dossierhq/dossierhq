import type {
  AdminClient,
  AdminClientMiddleware,
  AdminClientOperation,
  ClientContext,
  ErrorType,
  Logger,
  PromiseResult,
  Result,
} from '@jonasb/datadata-core';
import {
  convertAdminClientOperationToJson,
  convertJsonAdminClientResult,
  createBaseAdminClient,
  LoggingClientMiddleware,
  notOk,
  ok,
  Schema,
} from '@jonasb/datadata-core';
import type { InMemorySessionContext } from '@jonasb/datadata-testing-utils';
import { createInMemoryAdminClient, InMemoryServer } from '@jonasb/datadata-testing-utils';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import type { DataDataContextAdapter } from '..';
import { DataDataContextValue } from '..';
import schema from '../stories/StoryboardSchema';
import { entitiesFixture } from './EntityFixtures';

interface BackendContext {
  logger: Logger;
}

const GENERATE_ENTITIES_UUID_NAMESPACE = '96597f34-8654-4f66-b98d-3e9f5bb7cc9a';

export async function createContextValue2(
  middleware: AdminClientMiddleware<BackendContext>[] = []
): PromiseResult<DataDataContextValue, ErrorType.Generic> {
  const adminClient = createBackendAdminClient(middleware);
  //TODO add a schema React context so we don't need to fetch here
  const schemaResult = await adminClient.getSchemaSpecification();
  if (schemaResult.isError()) return schemaResult;
  const schema = new Schema(schemaResult.value);
  return ok(new DataDataContextValue(new TestContextAdapter(), adminClient, schema));
}

export function createBackendAdminClient(
  middleware: AdminClientMiddleware<BackendContext>[] = []
): AdminClient {
  const context: BackendContext = { logger: createConsoleLogger() };
  return createBaseAdminClient<BackendContext>({
    context,
    pipeline: [
      ...middleware,
      LoggingClientMiddleware as AdminClientMiddleware<BackendContext>,
      terminatingMiddleware,
    ],
  });
}

function createConsoleLogger(): Logger {
  return {
    error(message, ...args) {
      console.error(`error: ${message}`, ...args);
    },
    warn(message, ...args) {
      console.warn(`warn: ${message}`, ...args);
    },
    info(message, ...args) {
      console.info(`info: ${message}`, ...args);
    },
    debug(message, ...args) {
      console.debug(`debug: ${message}`, ...args);
    },
  };
}

async function terminatingMiddleware(
  _context: BackendContext,
  operation: AdminClientOperation
): Promise<void> {
  const jsonOperation = convertAdminClientOperationToJson(operation);

  let response: Response;
  if (operation.modifies) {
    response = await fetch(`/admin?name=${operation.name}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(jsonOperation),
    });
  } else {
    response = await fetch(
      `admin?name=${operation.name}&${encodeQuery({ operation: jsonOperation })}`,
      {
        method: 'GET',
        headers: { 'content-type': 'application/json' },
      }
    );
  }

  let result: Result<unknown, ErrorType>;
  if (response.ok) {
    try {
      result = ok(JSON.parse(await response.text()));
    } catch (error) {
      result = notOk.Generic('Failed parsing response');
    }
  } else {
    let text = 'Failed fetching response';
    try {
      text = await response.text();
    } catch (error) {
      // ignore
    }
    result = notOk.fromHttpStatus(response.status, text);
  }
  operation.resolve(convertJsonAdminClientResult(operation.name, result));
}

function encodeQuery(entries: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(entries)) {
    if (value === null || value === undefined) {
      continue;
    }
    const encoded = `${key}=${encodeURIComponent(JSON.stringify(value))}`;
    parts.push(encoded);
  }
  return parts.join('&');
}

export function createContextValue({
  adapter,
  adminClientMiddleware,
}: {
  adapter?: TestContextAdapter;
  adminClientMiddleware?: AdminClientMiddleware<InMemorySessionContext>[];
} = {}): {
  contextValue: DataDataContextValue;
  adminClient: AdminClient;
} {
  schema.validate().throwIfError();

  const userId = 'adba1452-1b89-42e9-8878-d0a2becf101f';
  const server = new InMemoryServer(schema);
  server.loadEntities(entitiesFixture);
  const context = server.createContext(userId);

  const adminClient = createInMemoryAdminClient({
    context,
    middleware: adminClientMiddleware ?? [],
  });

  return {
    contextValue: new DataDataContextValue(
      adapter ?? new TestContextAdapter(),
      adminClient,
      schema,
      uuidv4()
    ),
    adminClient,
  };
}

export const SlowMiddleware: AdminClientMiddleware<ClientContext> = async (_context, operation) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  operation.resolve(await operation.next());
};

export class TestContextAdapter implements DataDataContextAdapter {
  getEditorJSConfig: DataDataContextAdapter['getEditorJSConfig'] = (
    _fieldSpec,
    standardBlockTools,
    standardInlineTools
  ) => {
    return { tools: standardBlockTools, inlineToolbar: standardInlineTools };
  };
}

export async function createManyBarEntities(
  adminClient: AdminClient,
  entityCount: number
): Promise<void> {
  for (let i = 0; i < entityCount; i += 1) {
    const id = uuidv5(`bar-${i}`, GENERATE_ENTITIES_UUID_NAMESPACE);
    const result = await adminClient.createEntity({
      id,
      info: { type: 'Bar', name: `Generated bar ${i}` },
      fields: { title: `Generated bar ${i}` },
    });
    result.throwIfError();
  }
}
