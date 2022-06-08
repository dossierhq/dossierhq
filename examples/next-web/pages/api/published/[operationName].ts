import type {
  PublishedClientJsonOperation,
  PublishedClientOperationName,
} from '@jonasb/datadata-core';
import {
  decodeUrlQueryStringifiedParam,
  executePublishedClientOperationFromJson,
  notOk,
} from '@jonasb/datadata-core';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { PublishedOperationRequest } from '../../../types/RequestTypes';
import { handleGet, handlePut, sendMethodNotAllowedError } from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

export default async function publishedOperationHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === 'GET') {
    await handleGet(req, res, async () => {
      const operation: PublishedClientJsonOperation | undefined = decodeUrlQueryStringifiedParam(
        'operation',
        req.query
      );
      if (!operation) {
        return notOk.BadRequest('Missing operation query');
      }

      return executePublishedOperation(req, operation);
    });
  } else if (req.method === 'PUT') {
    await handlePut(req, res, async (body: PublishedOperationRequest) => {
      return executePublishedOperation(req, body);
    });
  } else {
    sendMethodNotAllowedError(res, ['GET', 'PUT']);
  }
}

async function executePublishedOperation(
  req: NextApiRequest,
  operation: PublishedClientJsonOperation
) {
  const { operationName } = req.query;
  if (typeof operationName !== 'string') return notOk.BadRequest('Operation name not provided');

  const { server } = await getServerConnection();
  const authResult = await getSessionContextForRequest(server, req);
  if (authResult.isError()) return authResult;
  const { publishedClient } = authResult.value;

  const result = await executePublishedClientOperationFromJson(
    publishedClient,
    operationName as keyof typeof PublishedClientOperationName,
    operation
  );
  return result;
}
