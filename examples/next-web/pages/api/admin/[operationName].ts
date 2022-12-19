import type {
  AdminClientJsonOperationArgs,
  AdminClientOperationName,
  ErrorType,
  Result,
} from '@jonasb/datadata-core';
import {
  decodeUrlQueryStringifiedParam,
  executeAdminClientOperationFromJson,
  notOk,
  ok,
} from '@jonasb/datadata-core';
import type { NextApiRequest, NextApiResponse } from 'next';
import { handleRequest, sendMethodNotAllowedError } from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

export default async function adminOperationHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === 'GET' || req.method === 'PUT') {
    await handleRequest(res, async () => {
      return executeAdminOperation(req);
    });
  } else {
    sendMethodNotAllowedError(res, ['GET', 'PUT']);
  }
}

function getOperationArgs(
  req: NextApiRequest
): Result<AdminClientJsonOperationArgs, typeof ErrorType.BadRequest> {
  let operationArgs: AdminClientJsonOperationArgs | undefined;
  if (req.method === 'GET') {
    operationArgs = decodeUrlQueryStringifiedParam('operation', req.query);
  } else {
    operationArgs = req.body;
  }
  if (!operationArgs) {
    return notOk.BadRequest('Missing operation');
  }
  return ok(operationArgs);
}

async function executeAdminOperation(req: NextApiRequest) {
  const { operationName } = req.query;
  if (typeof operationName !== 'string') return notOk.BadRequest('Operation name not provided');

  const operationResult = getOperationArgs(req);
  if (operationResult.isError()) return operationResult;

  const { server } = await getServerConnection();
  const authResult = await getSessionContextForRequest(server, req);
  if (authResult.isError()) return authResult;
  const { adminClient } = authResult.value;

  const result = await executeAdminClientOperationFromJson(
    adminClient,
    operationName as keyof typeof AdminClientOperationName,
    operationResult.value
  );
  return result;
}
