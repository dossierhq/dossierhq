import {
  ErrorType,
  decodeURLSearchParamsParam,
  executePublishedClientOperationFromJson,
  ok,
  type Result,
} from '@dossierhq/core';
import type { APIContext } from 'astro';
import { DEFAULT_AUTH_KEYS } from '../../../dossier/config/AuthKeyConfig.ts';
import { getServer } from '../../../dossier/utils/ServerUtils.ts';

export async function GET({
  params,
  request,
}: APIContext<Record<string, any>, { operationName: string }>) {
  const url = new URL(request.url);
  const urlQuery = new URLSearchParams(url.search);
  const operationArgs = decodeURLSearchParamsParam(urlQuery, 'args');
  return convertResultToResponse(
    await executePublishedOperation(params.operationName, operationArgs),
  );
}

function convertResultToResponse(result: Result<unknown, ErrorType>) {
  if (result.isOk()) {
    return Response.json(result.value);
  }
  return new Response(result.message, { status: result.httpStatus });
}

async function executePublishedOperation(operationName: string, operationArgs: any) {
  const publishedClientResult = await getPublishedClient();
  if (publishedClientResult.isError()) return publishedClientResult;
  const publishedClient = publishedClientResult.value;

  const result = await executePublishedClientOperationFromJson(
    publishedClient,
    operationName,
    operationArgs,
  );
  return result;
}

async function getPublishedClient() {
  const server = await getServer();
  const sessionResult = await server.createSession({
    provider: 'test',
    identifier: 'john-smith',
    defaultAuthKeys: DEFAULT_AUTH_KEYS,
    logger: null,
    databasePerformance: null,
  });
  if (sessionResult.isError()) return sessionResult;
  return ok(server.createPublishedClient(sessionResult.value.context));
}
