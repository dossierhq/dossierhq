import type { AdminClientJsonOperation, AdminClientOperationName } from '@jonasb/datadata-core';
import { notOk } from '@jonasb/datadata-core';
import {
  decodeUrlQueryStringifiedParam,
  executeAdminClientOperationFromJson,
} from '@jonasb/datadata-core';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { AdminOperationRequest } from '../../../types/RequestTypes';
import { handleGet, handlePut, sendMethodNotAllowedError } from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

export default async function adminOperationHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === 'GET') {
    await handleGet(req, res, async () => {
      const operation: AdminClientJsonOperation | undefined = decodeUrlQueryStringifiedParam(
        'operation',
        req.query
      );
      if (!operation) return notOk.BadRequest('Missing operation query');
      return executeAdminOperation(req, operation);
    });
  } else if (req.method === 'PUT') {
    await handlePut(req, res, async (body: AdminOperationRequest) => {
      return executeAdminOperation(req, body);
    });
  } else {
    sendMethodNotAllowedError(res, ['GET', 'PUT']);
  }
}

async function executeAdminOperation(req: NextApiRequest, operation: AdminClientJsonOperation) {
  const { operationName } = req.query;
  if (typeof operationName !== 'string') return notOk.BadRequest('Operation name not provided');

  const { server } = await getServerConnection();
  const authResult = await getSessionContextForRequest(server, req);
  if (authResult.isError()) return authResult;
  const { adminClient } = authResult.value;

  const result = await executeAdminClientOperationFromJson(
    adminClient,
    operationName as keyof typeof AdminClientOperationName,
    operation
  );
  return result;
}
