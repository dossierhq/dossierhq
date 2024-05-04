import {
  convertJsonDossierClientResult,
  convertJsonPublishedDossierClientResult,
  createBaseDossierClient,
  createBasePublishedDossierClient,
  createConsoleLogger,
  encodeObjectToURLSearchParams,
  LoggingClientMiddleware,
  notOk,
  ok,
  type ClientContext,
  type DossierClient,
  type DossierClientMiddleware,
  type DossierClientOperation,
  type ErrorType,
  type Logger,
  type PromiseResult,
  type PublishedDossierClient,
  type PublishedDossierClientMiddleware,
  type PublishedDossierClientOperation,
} from '@dossierhq/core';
import { v5 as uuidv5 } from 'uuid';
import type { FieldDisplayProps } from '../components/EntityDisplay/FieldDisplay.js';
import type { FieldEditorProps } from '../components/EntityEditor/FieldEditor.js';
import type {
  AdminDossierContextAdapter,
  RichTextComponentEditorProps,
} from '../contexts/AdminDossierContext.js';
import type {
  PublishedDossierContextAdapter,
  RichTextComponentDisplayProps,
} from '../contexts/PublishedDossierContext.js';

interface BackendContext {
  logger: Logger;
}

const GENERATE_ENTITIES_UUID_NAMESPACE = '96597f34-8654-4f66-b98d-3e9f5bb7cc9a';

export const DISPLAY_AUTH_KEYS = [
  { authKey: '', displayName: 'Default' },
  { authKey: 'subject', displayName: 'User private' },
];
const AUTH_KEYS_HEADER = {
  'Dossier-Default-Auth-Keys': DISPLAY_AUTH_KEYS.map((it) => it.authKey).join(', '),
};

export function createBackendDossierClient(
  pipeline: DossierClientMiddleware<BackendContext>[] = [],
): DossierClient {
  const context: BackendContext = { logger: createConsoleLogger(console) };
  return createBaseDossierClient<BackendContext>({
    context,
    pipeline: [
      ...pipeline,
      LoggingClientMiddleware as DossierClientMiddleware<BackendContext>,
      terminatingAdminMiddleware,
    ],
  });
}

export function createBackendPublishedClient(
  pipeline: PublishedDossierClientMiddleware<BackendContext>[] = [],
): PublishedDossierClient {
  const context: BackendContext = { logger: createConsoleLogger(console) };
  return createBasePublishedDossierClient<BackendContext>({
    context,
    pipeline: [
      ...pipeline,
      LoggingClientMiddleware as PublishedDossierClientMiddleware<BackendContext>,
      terminatingPublishedMiddleware,
    ],
  });
}

async function terminatingAdminMiddleware(
  _context: BackendContext,
  operation: DossierClientOperation,
): Promise<void> {
  let response: Response;
  if (operation.modifies) {
    response = await fetch(`/api/admin/${operation.name}`, {
      method: 'PUT',
      headers: { ...AUTH_KEYS_HEADER, 'content-type': 'application/json' },
      body: JSON.stringify(operation.args),
    });
  } else {
    response = await fetch(
      `/api/admin/${operation.name}?${encodeObjectToURLSearchParams(
        { args: operation.args },
        { keepEmptyObjects: true },
      )}`,
      { method: 'GET', headers: AUTH_KEYS_HEADER },
    );
  }

  const result = await getBodyAsJsonResult(response);
  operation.resolve(convertJsonDossierClientResult(operation.name, result));
}

async function terminatingPublishedMiddleware(
  _context: BackendContext,
  operation: PublishedDossierClientOperation,
): Promise<void> {
  const response = await fetch(
    `/api/published/${operation.name}?${encodeObjectToURLSearchParams(
      { args: operation.args },
      { keepEmptyObjects: true },
    )}`,
    { method: 'GET', headers: AUTH_KEYS_HEADER },
  );

  const result = await getBodyAsJsonResult(response);
  operation.resolve(convertJsonPublishedDossierClientResult(operation.name, result));
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

export function createSlowAdminMiddleware(): DossierClientMiddleware<ClientContext> {
  return async (_context, operation) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    operation.resolve(await operation.next());
  };
}

export function createSlowPublishedMiddleware(): PublishedDossierClientMiddleware<ClientContext> {
  return async (_context, operation) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    operation.resolve(await operation.next());
  };
}

export class TestContextAdapter
  implements AdminDossierContextAdapter, PublishedDossierContextAdapter
{
  renderPublishedFieldDisplay(_props: FieldDisplayProps): JSX.Element | null {
    return null;
  }
  renderPublishedRichTextComponentDisplay(
    _props: RichTextComponentDisplayProps,
  ): JSX.Element | null {
    return null;
  }
  renderAdminFieldEditor(_props: FieldEditorProps): JSX.Element | null {
    return null;
  }
  renderAdminRichTextComponentEditor(_props: RichTextComponentEditorProps): JSX.Element | null {
    return null;
  }
}

export async function ensureManyBarEntities(
  client: DossierClient,
  entityCount: number,
): PromiseResult<void, ErrorType> {
  const totalCountResult = await client.getEntitiesTotalCount({ entityTypes: ['Bar'] });
  if (totalCountResult.isError()) return totalCountResult;

  for (let i = totalCountResult.value; i <= entityCount; i += 1) {
    const id = uuidv5(`bar-${i}`, GENERATE_ENTITIES_UUID_NAMESPACE);
    const result = await client.createEntity({
      id,
      info: { type: 'Bar', name: `Generated bar ${i}` },
      fields: { title: `Generated bar ${i}` },
    });
    if (result.isError()) {
      return result;
    }
  }
  return ok(undefined);
}
