import type {
  ErrorType,
  PublishedClientJsonOperation,
  PublishedClientOperationName,
  Result,
} from '@jonasb/datadata-core';
import {
  decodeUrlQueryStringifiedParam,
  executePublishedClientOperationFromJson,
  notOk,
  ok,
} from '@jonasb/datadata-core';
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

function getOperation(
  req: NextApiRequest
): Result<PublishedClientJsonOperation, typeof ErrorType.BadRequest> {
  let operation: PublishedClientJsonOperation | undefined;
  if (req.method === 'GET') {
    operation = decodeUrlQueryStringifiedParam('operation', req.query);
  } else {
    operation = req.body;
  }
  if (!operation) {
    return notOk.BadRequest('Missing operation');
  }
  return ok(operation);
}

async function executePublishedOperation(req: NextApiRequest) {
  const { operationName } = req.query;
  if (typeof operationName !== 'string') return notOk.BadRequest('Operation name not provided');

  const operationResult = getOperation(req);
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
