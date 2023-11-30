import {
  decodeURLSearchParamsParam,
  executePublishedClientOperationFromJson,
  type ErrorType,
  type Result,
} from '@dossierhq/core';
import type { APIContext } from 'astro';
import { getAuthenticatedPublishedClient } from '../../../dossier/utils/ServerUtils.ts';

export const prerender = false;

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
  const publishedClientResult = await getAuthenticatedPublishedClient();
  if (publishedClientResult.isError()) return publishedClientResult;
  const publishedClient = publishedClientResult.value;

  const result = await executePublishedClientOperationFromJson(
    publishedClient,
    operationName,
    operationArgs,
  );
  return result;
}
