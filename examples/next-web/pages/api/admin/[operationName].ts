import Boom from '@hapi/boom';
import type { AdminClientJsonOperation } from '@jonasb/datadata-core';
import {
  AdminClientOperationName,
  executeAdminClientOperationFromJson,
} from '@jonasb/datadata-core';
import Joi from 'joi';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { AdminOperationRequest } from '../../../types/RequestTypes';
import { errorResultToBoom } from '../../../utils/ErrorUtils';
import {
  handleError,
  handleGet,
  handlePut,
  validateRequestQuery,
} from '../../../utils/HandlerUtils';
import { decodeQuery } from '../../../utils/QueryUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

interface RequestQuery {
  operationName: AdminClientOperationName;
  operation?: string;
}

const requestSchema = Joi.object<RequestQuery>({
  operationName: Joi.string()
    .required()
    .allow(...Object.values(AdminClientOperationName)),
  operation: Joi.string().optional(),
});

export default async function adminOperationHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { operationName } = validateRequestQuery(req.query, requestSchema);
  if (req.method === 'GET') {
    await handleGet(req, res, async () => {
      const { server } = await getServerConnection();
      const authResult = await getSessionContextForRequest(server, req);
      if (authResult.isError()) {
        throw errorResultToBoom(authResult);
      }
      const { adminClient } = authResult.value;

      const operation = decodeQuery<AdminClientJsonOperation>('operation', req.query);
      if (!operation) {
        throw Boom.badRequest('Missing operation query');
      }

      const result = await executeAdminClientOperationFromJson(
        adminClient,
        operationName,
        operation
      );
      if (result.isError()) {
        throw errorResultToBoom(result);
      }
      return result.value;
    });
  } else if (req.method === 'PUT') {
    await handlePut(req, res, async (body: AdminOperationRequest) => {
      const { server } = await getServerConnection();
      const authResult = await getSessionContextForRequest(server, req);
      if (authResult.isError()) {
        throw errorResultToBoom(authResult);
      }
      const { adminClient } = authResult.value;

      const result = await executeAdminClientOperationFromJson(adminClient, operationName, body);
      if (result.isError()) {
        throw errorResultToBoom(result);
      }
      return result.value;
    });
  } else {
    handleError(res, Boom.methodNotAllowed(undefined, undefined, ['GET', 'PUT']));
  }
}
