import Boom from '@hapi/boom';
import {
  AdminClientJsonOperation,
  AdminClientOperationName,
  executeAdminClientOperationFromJson,
} from '@jonasb/datadata-core';
import Joi from 'joi';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { AdminOperationRequest } from '../../../types/RequestTypes';
import { errorResultToBoom } from '../../../utils/ErrorUtils';
import {
  handleError,
  handleGetAsync,
  handlePutAsync,
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

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const { operationName } = validateRequestQuery(req.query, requestSchema);
  if (req.method === 'GET') {
    await handleGetAsync(req, res, async () => {
      const { authContext, server } = await getServerConnection();
      const authResult = await getSessionContextForRequest(server, authContext, req);
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
    await handlePutAsync(req, res, async (body: AdminOperationRequest) => {
      const { authContext, server } = await getServerConnection();
      const authResult = await getSessionContextForRequest(server, authContext, req);
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
};
