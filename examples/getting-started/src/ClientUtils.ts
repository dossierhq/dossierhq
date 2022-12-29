import {
  AdminClientMiddleware,
  AdminClientOperation,
  buildUrlWithUrlQuery,
  ClientContext,
  convertJsonAdminClientResult,
  convertJsonPublishedClientResult,
  createBaseAdminClient,
  createBasePublishedClient,
  createConsoleLogger,
  notOk,
  ok,
  PublishedClientOperation,
  stringifyUrlQueryParams,
} from '@jonasb/datadata-core';
import { AppAdminClient, AppPublishedClient } from './SchemaTypes.js';

const logger = createConsoleLogger(console);

export function createAdminClient(pipeline: AdminClientMiddleware<ClientContext>[] = []) {
  return createBaseAdminClient<ClientContext, AppAdminClient>({
    context: { logger },
    pipeline: [...pipeline, adminBackendMiddleware],
  });
}

async function adminBackendMiddleware(
  context: ClientContext,
  operation: AdminClientOperation
): Promise<void> {
  let response: Response;
  if (operation.modifies) {
    response = await fetch(`/api/admin/${operation.name}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(operation.args),
    });
  } else {
    response = await fetch(
      buildUrlWithUrlQuery(
        `/api/admin/${operation.name}`,
        stringifyUrlQueryParams({ args: operation.args }, { keepEmptyObjects: true })
      )
    );
  }

  const result = await getBodyAsJsonResult(response);
  operation.resolve(convertJsonAdminClientResult(operation.name, result));
}

export function createPublishedClient() {
  return createBasePublishedClient<ClientContext, AppPublishedClient>({
    context: { logger },
    pipeline: [publishedBackendMiddleware],
  });
}

async function publishedBackendMiddleware(
  context: ClientContext,
  operation: PublishedClientOperation
): Promise<void> {
  const response = await fetch(
    buildUrlWithUrlQuery(
      `/api/published/${operation.name}`,
      stringifyUrlQueryParams({ args: operation.args }, { keepEmptyObjects: true })
    )
  );
  const result = await getBodyAsJsonResult(response);
  operation.resolve(convertJsonPublishedClientResult(operation.name, result));
}

async function getBodyAsJsonResult(response: Response) {
  if (response.ok) {
    try {
      return ok(await response.json());
    } catch (error) {
      return notOk.Generic('Failed parsing response');
    }
  } else {
    let text = 'Failed fetching response';
    try {
      text = await response.text();
    } catch (error) {
      // ignore
    }
    return notOk.fromHttpStatus(response.status, text);
  }
}
