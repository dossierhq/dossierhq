import type {
  ErrorType,
  PublishedClientJsonOperationArgs,
  PublishedClientOperationName,
  Result,
} from '@dossierhq/core';
import {
  decodeURLSearchParamsParam,
  executePublishedClientOperationFromJson,
  notOk,
  ok,
} from '@dossierhq/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import { handleRequest, sendMethodNotAllowedError } from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

export default async function publishedOperationHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === 'GET' || req.method === 'PUT') {
    await handleRequest(res, async () => {
      return executePublishedOperation(req);
    });
  } else {
    sendMethodNotAllowedError(res, ['GET', 'PUT']);
  }
}

function getOperationArgs(
  req: NextApiRequest
): Result<PublishedClientJsonOperationArgs, typeof ErrorType.BadRequest> {
  let operationArgs: PublishedClientJsonOperationArgs | undefined;
  if (req.method === 'GET') {
    operationArgs = decodeURLSearchParamsParam(req.query, 'args');
  } else {
    operationArgs = req.body;
  }
  if (!operationArgs) {
    return notOk.BadRequest('Missing args');
  }
  return ok(operationArgs);
}

async function executePublishedOperation(req: NextApiRequest) {
  const { operationName } = req.query;
  if (typeof operationName !== 'string') return notOk.BadRequest('Operation name not provided');

  const operationResult = getOperationArgs(req);
  if (operationResult.isError()) return operationResult;

  const { server } = await getServerConnection();
  const authResult = await getSessionContextForRequest(server, req);
  if (authResult.isError()) return authResult;
  const { publishedClient } = authResult.value;

  const result = await executePublishedClientOperationFromJson(
    publishedClient,
    operationName as keyof typeof PublishedClientOperationName,
    operationResult.value
  );
  return result;
}
