import type { ErrorType, PublishedClientJsonOperationArgs, Result } from '@dossierhq/core';
import {
  decodeURLSearchParamsParam,
  executePublishedClientOperationFromJson,
  notOk,
  ok,
} from '@dossierhq/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import { DatabasePerformanceMonitor } from '../../../utils/DatabasePerformanceMonitor';
import { handleRequest, sendMethodNotAllowedError } from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

export default async function publishedOperationHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === 'GET') {
    await handleRequest(res, async () => {
      return executePublishedOperation(req, res);
    });
  } else {
    sendMethodNotAllowedError(res, ['GET']);
  }
}

function getOperationArgs(
  req: NextApiRequest
): Result<PublishedClientJsonOperationArgs, typeof ErrorType.BadRequest> {
  const operationArgs = decodeURLSearchParamsParam<PublishedClientJsonOperationArgs>(
    req.query,
    'args'
  );
  if (!operationArgs) {
    return notOk.BadRequest('Missing args');
  }
  return ok(operationArgs);
}

async function executePublishedOperation(req: NextApiRequest, res: NextApiResponse) {
  const { operationName } = req.query;
  if (typeof operationName !== 'string') return notOk.BadRequest('Operation name not provided');

  const operationResult = getOperationArgs(req);
  if (operationResult.isError()) return operationResult;

  const databasePerformance = new DatabasePerformanceMonitor();

  const { server } = await getServerConnection();
  const authResult = await getSessionContextForRequest(server, req, databasePerformance);
  if (authResult.isError()) return authResult;
  const { publishedClient } = authResult.value;

  const result = await executePublishedClientOperationFromJson(
    publishedClient,
    operationName,
    operationResult.value
  );

  const serverTiming = databasePerformance.getServerTimingHeader();
  if (serverTiming) {
    res.setHeader('Server-Timing', serverTiming);
  }

  return result;
}
