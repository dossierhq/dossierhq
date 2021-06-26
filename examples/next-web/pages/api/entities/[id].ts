import Boom from '@hapi/boom';
import Joi from 'joi';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { EntityUpdateRequest } from '../../../types/RequestTypes';
import type { EntityResponse } from '../../../types/ResponseTypes';
import { errorResultToBoom } from '../../../utils/ErrorUtils';
import {
  handleError,
  handleGetAsync,
  handlePutAsync,
  validateRequestQuery,
} from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

interface RequestQuery {
  id: string;
  version?: number | null;
}
const requestSchema = Joi.object<RequestQuery>({
  id: Joi.string().required(),
  version: Joi.number(),
});

export default async (req: NextApiRequest, res: NextApiResponse<EntityResponse>): Promise<void> => {
  if (req.method === 'GET') {
    await handleGetAsync(req, res, async () => {
      const { id, version } = validateRequestQuery(req.query, requestSchema);

      const { authContext, server } = await getServerConnection();
      const authResult = await getSessionContextForRequest(server, authContext, req);
      if (authResult.isError()) {
        throw errorResultToBoom(authResult);
      }
      const { adminClient } = authResult.value;

      const result = await adminClient.getEntity(
        typeof version === 'number' ? { id, version } : { id }
      );
      if (result.isError()) {
        throw errorResultToBoom(result);
      }
      return { item: result.value };
    });
  } else if (req.method === 'PUT') {
    await handlePutAsync(req, res, async (body: EntityUpdateRequest) => {
      const { id } = validateRequestQuery(req.query, requestSchema); //TODO id????
      const { authContext, server } = await getServerConnection();
      const authResult = await getSessionContextForRequest(server, authContext, req);
      if (authResult.isError()) {
        throw errorResultToBoom(authResult);
      }
      const { adminClient } = authResult.value;

      const result = await adminClient.updateEntity(body.item);

      if (result.isError()) {
        throw errorResultToBoom(result);
      }
      return { item: result.value };
    });
  } else {
    handleError(res, Boom.methodNotAllowed(undefined, undefined, ['GET', 'PUT']));
  }
};
