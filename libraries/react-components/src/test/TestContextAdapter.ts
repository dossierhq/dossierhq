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
} from '@dossierhq/core';
import {
  convertJsonAdminClientResult,
  convertJsonPublishedClientResult,
  createBaseAdminClient,
  createBasePublishedClient,
  createConsoleLogger,
  encodeObjectToURLSearchParams,
  LoggingClientMiddleware,
  notOk,
  ok,
} from '@dossierhq/core';
import { v5 as uuidv5 } from 'uuid';
import type { FieldDisplayProps } from '../components/EntityDisplay/FieldDisplay.js';
import type { FieldEditorProps } from '../components/EntityEditor/FieldEditor.js';
import type {
  AdminDataDataContextAdapter,
  RichTextValueItemEditorProps,
} from '../contexts/AdminDataDataContext.js';
import type {
  PublishedDataDataContextAdapter,
  RichTextValueItemDisplayProps,
} from '../published/contexts/PublishedDataDataContext.js';

interface BackendContext {
  logger: Logger;
}

const GENERATE_ENTITIES_UUID_NAMESPACE = '96597f34-8654-4f66-b98d-3e9f5bb7cc9a';

export const DISPLAY_AUTH_KEYS = [
  { authKey: 'none', displayName: 'None' },
  { authKey: 'subject', displayName: 'User private' },
];
const AUTH_KEYS_HEADER = {
  'Dossier-Default-Auth-Keys': DISPLAY_AUTH_KEYS.map((it) => it.authKey).join(', '),
};

export function createBackendAdminClient(
  pipeline: AdminClientMiddleware<BackendContext>[] = []
): AdminClient {
  const context: BackendContext = { logger: createConsoleLogger(console) };
  return createBaseAdminClient<BackendContext>({
    context,
    pipeline: [
      ...pipeline,
      LoggingClientMiddleware as AdminClientMiddleware<BackendContext>,
      terminatingAdminMiddleware,
    ],
  });
}

export function createBackendPublishedClient(
  pipeline: PublishedClientMiddleware<BackendContext>[] = []
): PublishedClient {
  const context: BackendContext = { logger: createConsoleLogger(console) };
  return createBasePublishedClient<BackendContext>({
    context,
    pipeline: [
      ...pipeline,
      LoggingClientMiddleware as PublishedClientMiddleware<BackendContext>,
      terminatingPublishedMiddleware,
    ],
  });
}

async function terminatingAdminMiddleware(
  _context: BackendContext,
  operation: AdminClientOperation
): Promise<void> {
  let response: Response;
  if (operation.modifies) {
    response = await fetch(`/admin?name=${operation.name}`, {
      method: 'PUT',
      headers: { ...AUTH_KEYS_HEADER, 'content-type': 'application/json' },
      body: JSON.stringify(operation.args),
    });
  } else {
    response = await fetch(
      `/api/admin/${operation.name}?${encodeObjectToURLSearchParams(
        { args: operation.args },
        { keepEmptyObjects: true }
      )}`,
      { method: 'GET', headers: AUTH_KEYS_HEADER }
    );
  }

  const result = await getBodyAsJsonResult(response);
  operation.resolve(convertJsonAdminClientResult(operation.name, result));
}

async function terminatingPublishedMiddleware(
  _context: BackendContext,
  operation: PublishedClientOperation
): Promise<void> {
  const response = await fetch(
    `/api/published/${operation.name}?${encodeObjectToURLSearchParams(
      { args: operation.args },
      { keepEmptyObjects: true }
    )}`,
    { method: 'GET', headers: AUTH_KEYS_HEADER }
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

export function createSlowAdminMiddleware(): AdminClientMiddleware<ClientContext> {
  return async (_context, operation) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    operation.resolve(await operation.next());
  };
}

export function createSlowPublishedMiddleware(): PublishedClientMiddleware<ClientContext> {
  return async (_context, operation) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    operation.resolve(await operation.next());
  };
}

export class TestContextAdapter
  implements AdminDataDataContextAdapter, PublishedDataDataContextAdapter
{
  renderPublishedFieldDisplay(_props: FieldDisplayProps): JSX.Element | null {
    return null;
  }
  renderPublishedRichTextValueItemDisplay(
    _props: RichTextValueItemDisplayProps
  ): JSX.Element | null {
    return null;
  }
  renderAdminFieldEditor(_props: FieldEditorProps): JSX.Element | null {
    return null;
  }
  renderAdminRichTextValueItemEditor(_props: RichTextValueItemEditorProps): JSX.Element | null {
    return null;
  }
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
