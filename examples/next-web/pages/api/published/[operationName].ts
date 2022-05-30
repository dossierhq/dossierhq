import Boom from '@hapi/boom';
import type { PublishedClientJsonOperation } from '@jonasb/datadata-core';
import {
  decodeUrlQueryStringifiedParam,
  executePublishedClientOperationFromJson,
  PublishedClientOperationName,
} from '@jonasb/datadata-core';
import Joi from 'joi';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { PublishedOperationRequest } from '../../../types/RequestTypes';
import { errorResultToBoom } from '../../../utils/ErrorUtils';
import {
  handleError,
  handleGet,
  handlePut,
  validateRequestQuery,
} from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

interface RequestQuery {
  operationName: keyof typeof PublishedClientOperationName;
  operation?: string;
}

const requestSchema = Joi.object<RequestQuery>({
  operationName: Joi.string()
    .required()
    .allow(...Object.values(PublishedClientOperationName)),
  operation: Joi.string().optional(),
});

export default async function publishedOperationHandler(
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
      const { publishedClient } = authResult.value;

      const operation: PublishedClientJsonOperation | undefined = decodeUrlQueryStringifiedParam(
        'operation',
        req.query
      );
      if (!operation) {
        throw Boom.badRequest('Missing operation query');
      }

      const result = await executePublishedClientOperationFromJson(
        publishedClient,
        operationName,
        operation
      );
      if (result.isError()) {
        throw errorResultToBoom(result);
      }
      return result.value;
    });
  } else if (req.method === 'PUT') {
    await handlePut(req, res, async (body: PublishedOperationRequest) => {
      const { server } = await getServerConnection();
      const authResult = await getSessionContextForRequest(server, req);
      if (authResult.isError()) {
        throw errorResultToBoom(authResult);
      }
      const { publishedClient } = authResult.value;

      const result = await executePublishedClientOperationFromJson(
        publishedClient,
        operationName,
        body
      );
      if (result.isError()) {
        throw errorResultToBoom(result);
      }
      return result.value;
    });
  } else {
    handleError(res, Boom.methodNotAllowed(undefined, undefined, ['GET', 'PUT']));
  }
}
