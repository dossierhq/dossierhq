import type { DossierClientJsonOperationArgs, ErrorType, Result } from '@dossierhq/core';
import {
  DossierClientModifyingOperations,
  decodeURLSearchParamsParam,
  executeDossierClientOperationFromJson,
  notOk,
  ok,
} from '@dossierhq/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ENABLE_WEB_INTERFACE } from '../../../config/WebInterfaceConfig';
import { handleRequest, sendMethodNotAllowedError } from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

export default async function adminOperationHandler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method === 'GET' || req.method === 'PUT') {
    await handleRequest(res, async () => {
      if (!ENABLE_WEB_INTERFACE) {
        return notOk.BadRequest('Web interface is disabled');
      }
      return executeAdminOperation(req);
    });
  } else {
    sendMethodNotAllowedError(res, ['GET', 'PUT']);
  }
}

function getOperationArgs(
  req: NextApiRequest,
): Result<DossierClientJsonOperationArgs, typeof ErrorType.BadRequest> {
  let operationArgs: DossierClientJsonOperationArgs | undefined;
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

async function executeAdminOperation(req: NextApiRequest) {
  const { operationName } = req.query;
  if (typeof operationName !== 'string') return notOk.BadRequest('Operation name not provided');

  const operationResult = getOperationArgs(req);
  if (operationResult.isError()) return operationResult;

  const { server } = await getServerConnection();
  const authResult = await getSessionContextForRequest(server, req);
  if (authResult.isError()) return authResult;
  const { client } = authResult.value;

  const operationModifies = DossierClientModifyingOperations.has(operationName);
  if (req.method === 'GET' && operationModifies) {
    return notOk.BadRequest('Operation modifies data, but GET was used');
  } else if (req.method === 'PUT' && !operationModifies) {
    return notOk.BadRequest('Operation does not modify data, but PUT was used');
  }

  const result = await executeDossierClientOperationFromJson(
    client,
    operationName,
    operationResult.value,
  );
  return result;
}
