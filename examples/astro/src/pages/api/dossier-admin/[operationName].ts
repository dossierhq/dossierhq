import {
  DossierClientModifyingOperations,
  decodeURLSearchParamsParam,
  executeDossierClientOperationFromJson,
  notOk,
  type ErrorType,
  type Result,
} from '@dossierhq/core';
import type { APIContext } from 'astro';
import { getAuthenticatedDossierClient } from '../../../dossier/utils/ServerUtils.ts';

export const prerender = false;

export async function GET({
  params,
  request,
}: APIContext<Record<string, any>, { operationName: string }>) {
  const url = new URL(request.url);
  const urlQuery = new URLSearchParams(url.search);
  const operationArgs = decodeURLSearchParamsParam(urlQuery, 'args');
  return convertResultToResponse(
    await executeAdminOperation('GET', params.operationName, operationArgs),
  );
}

export async function PUT({
  params,
  request,
}: APIContext<Record<string, any>, { operationName: string }>) {
  const body = await request.json();
  return convertResultToResponse(await executeAdminOperation('PUT', params.operationName, body));
}

function convertResultToResponse(result: Result<unknown, ErrorType>) {
  if (result.isOk()) {
    return Response.json(result.value);
  }
  return new Response(result.message, { status: result.httpStatus });
}

async function executeAdminOperation(
  method: 'GET' | 'PUT',
  operationName: string,
  operationArgs: any,
) {
  const operationModifies = DossierClientModifyingOperations.has(operationName);
  if (method === 'GET' && operationModifies) {
    return notOk.BadRequest('Operation modifies data, but GET was used');
  } else if (method === 'PUT' && !operationModifies) {
    return notOk.BadRequest('Operation does not modify data, but PUT was used');
  }

  const clientResult = await getAuthenticatedDossierClient(import.meta.env.DOSSIER_PRINCIPAL_ID);
  if (clientResult.isError()) return clientResult;
  const client = clientResult.value;

  const result = await executeDossierClientOperationFromJson(client, operationName, operationArgs);
  return result;
}
