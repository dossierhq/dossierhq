import { useAuth0, type Auth0ContextInterface } from '@auth0/auth0-react';
import {
  convertJsonDossierClientResult,
  convertJsonPublishedDossierClientResult,
  createBaseDossierClient,
  createBasePublishedDossierClient,
  createConsoleLogger,
  encodeObjectToURLSearchParams,
  notOk,
  ok,
  type ClientContext,
  type DossierClientOperation,
  type PublishedDossierClientOperation,
} from '@dossierhq/core';
import { useCachingAdminMiddleware } from '@dossierhq/react-components';
import { useMemo } from 'react';
import type { AppDossierClient, AppPublishedDossierClient } from './SchemaTypes.js';

const logger = createConsoleLogger(console);

export function useDossierClient(): AppDossierClient | null {
  const cachingAdminMiddleware = useCachingAdminMiddleware();
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0();

  return useMemo(
    () =>
      isLoading
        ? null
        : createBaseDossierClient<ClientContext, AppDossierClient>({
            context: { logger },
            pipeline: [
              cachingAdminMiddleware,
              createAdminBackendMiddleware(isAuthenticated, getAccessTokenSilently),
            ],
          }),
    [isLoading, isAuthenticated, getAccessTokenSilently, cachingAdminMiddleware],
  );
}

function createAdminBackendMiddleware(
  isAuthenticated: boolean,
  getAccessTokenSilently: Auth0ContextInterface['getAccessTokenSilently'],
) {
  return async (context: ClientContext, operation: DossierClientOperation): Promise<void> => {
    const authHeader: { Authorization?: string } = {};
    if (isAuthenticated) {
      const accessToken = await getAccessTokenSilently();
      authHeader['Authorization'] = `Bearer ${accessToken}`;
    }

    let response: Response;
    if (operation.modifies) {
      response = await fetch(`/api/admin/${operation.name}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', ...authHeader },
        body: JSON.stringify(operation.args),
      });
    } else {
      response = await fetch(
        `/api/admin/${operation.name}?${encodeObjectToURLSearchParams(
          { args: operation.args },
          { keepEmptyObjects: true },
        )}`,
        { headers: authHeader },
      );
    }

    const result = await getBodyAsJsonResult(response);
    operation.resolve(convertJsonDossierClientResult(operation.name, result));
  };
}

export function usePublishedClient(): AppPublishedDossierClient | null {
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0();

  return useMemo(
    () =>
      isLoading
        ? null
        : createBasePublishedDossierClient<ClientContext, AppPublishedDossierClient>({
            context: { logger },
            pipeline: [createPublishedBackendMiddleware(isAuthenticated, getAccessTokenSilently)],
          }),
    [isLoading, isAuthenticated, getAccessTokenSilently],
  );
}

function createPublishedBackendMiddleware(
  isAuthenticated: boolean,
  getAccessTokenSilently: Auth0ContextInterface['getAccessTokenSilently'],
) {
  return async (
    context: ClientContext,
    operation: PublishedDossierClientOperation,
  ): Promise<void> => {
    const authHeader: { Authorization?: string } = {};
    if (isAuthenticated) {
      const accessToken = await getAccessTokenSilently();
      authHeader['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(
      `/api/published/${operation.name}?${encodeObjectToURLSearchParams(
        { args: operation.args },
        { keepEmptyObjects: true },
      )}`,
      { headers: authHeader },
    );
    const result = await getBodyAsJsonResult(response);
    operation.resolve(convertJsonPublishedDossierClientResult(operation.name, result));
  };
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
