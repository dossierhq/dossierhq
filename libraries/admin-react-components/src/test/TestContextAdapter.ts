import type {
  AdminClient,
  AdminClientMiddleware,
  AdminClientOperation,
  ClientContext,
  ErrorType,
  Logger,
  PromiseResult,
  PublishedClient,
  PublishedClientMiddleware,
  PublishedClientOperation,
  Result,
} from '@jonasb/datadata-core';
import {
  AdminSchema,
  buildUrlWithUrlQuery,
  convertAdminClientOperationToJson,
  convertJsonAdminClientResult,
  convertJsonPublishedClientResult,
  convertPublishedClientOperationToJson,
  createBaseAdminClient,
  createBasePublishedClient,
  createConsoleLogger,
  LoggingClientMiddleware,
  NoOpLogger,
  notOk,
  ok,
  stringifyUrlQueryParams,
} from '@jonasb/datadata-core';
import { v5 as uuidv5 } from 'uuid';
import type { DataDataContextAdapter } from '..';
import { DataDataContextValue } from '..';

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
  const schema = new AdminSchema(schemaResult.value);
  return ok(new DataDataContextValue(new TestContextAdapter(), adminClient, schema, NoOpLogger));
}

export function createBackendAdminClient(
  middleware: AdminClientMiddleware<BackendContext>[] = []
): AdminClient {
  const context: BackendContext = { logger: createConsoleLogger(console) };
  return createBaseAdminClient<BackendContext>({
    context,
    pipeline: [
      ...middleware,
      LoggingClientMiddleware as AdminClientMiddleware<BackendContext>,
      terminatingAdminMiddleware,
    ],
  });
}

export function createBackendPublishedClient(
  middleware: PublishedClientMiddleware<BackendContext>[] = []
): PublishedClient {
  const context: BackendContext = { logger: createConsoleLogger(console) };
  return createBasePublishedClient<BackendContext>({
    context,
    pipeline: [
      ...middleware,
      LoggingClientMiddleware as PublishedClientMiddleware<BackendContext>,
      terminatingPublishedMiddleware,
    ],
  });
}

async function terminatingAdminMiddleware(
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
      buildUrlWithUrlQuery(
        `/admin?name=${operation.name}`,
        stringifyUrlQueryParams({ operation: jsonOperation }, { keepEmptyObjects: true })
      ),
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

async function terminatingPublishedMiddleware(
  _context: BackendContext,
  operation: PublishedClientOperation
): Promise<void> {
  const jsonOperation = convertPublishedClientOperationToJson(operation);

  let response: Response;
  if (operation.modifies) {
    response = await fetch(`/published?name=${operation.name}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(jsonOperation),
    });
  } else {
    response = await fetch(
      buildUrlWithUrlQuery(
        `/published?name=${operation.name}`,
        stringifyUrlQueryParams({ operation: jsonOperation }, { keepEmptyObjects: true })
      ),
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
  operation.resolve(convertJsonPublishedClientResult(operation.name, result));
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

export async function ensureManyBarEntities(
  adminClient: AdminClient,
  entityCount: number
): PromiseResult<void, ErrorType> {
  const totalCountResult = await adminClient.getTotalCount({ entityTypes: ['Bar'] });
  if (totalCountResult.isError()) return totalCountResult;

  for (let i = totalCountResult.value; i <= entityCount; i += 1) {
    const id = uuidv5(`bar-${i}`, GENERATE_ENTITIES_UUID_NAMESPACE);
    const result = await adminClient.createEntity({
      id,
      info: { type: 'Bar', name: `Generated bar ${i}`, authKey: 'none' },
      fields: { title: `Generated bar ${i}` },
    });
    if (result.isError()) {
      return result;
    }
  }
  return ok(undefined);
}
