import { EntityAdmin } from '@datadata/server';
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
import { decodeQuery } from '../../../utils/QueryUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

interface RequestQuery {
  id: string;
  options?: string;
}
const requestSchema = Joi.object<RequestQuery>({
  id: Joi.string().required(),
  options: Joi.string().allow('').required(),
});

export default async (req: NextApiRequest, res: NextApiResponse<EntityResponse>): Promise<void> => {
  if (req.method === 'GET') {
    await handleGetAsync(req, res, async () => {
      const { id } = validateRequestQuery(req.query, requestSchema);
      const options = decodeQuery<{ version?: number | null }>('options', req.query) ?? {};

      const { authContext, server } = await getServerConnection();
      const authResult = await getSessionContextForRequest(server, authContext, req);
      if (authResult.isError()) {
        throw errorResultToBoom(authResult);
      }
      const context = authResult.value;

      const result = await EntityAdmin.getEntity(context, id, options);
      if (result.isError()) {
        throw errorResultToBoom(result);
      }
      return result.value;
    });
  } else if (req.method === 'PUT') {
    await handlePutAsync(req, res, async (body: EntityUpdateRequest) => {
      const { id } = validateRequestQuery(req.query, requestSchema); //TODO id????
      const { authContext, server } = await getServerConnection();
      const authResult = await getSessionContextForRequest(server, authContext, req);
      if (authResult.isError()) {
        throw errorResultToBoom(authResult);
      }
      const context = authResult.value;

      const result = await EntityAdmin.updateEntity(context, body.item, body.options);

      if (result.isError()) {
        throw errorResultToBoom(result);
      }
      return { item: result.value };
    });
  } else {
    handleError(res, Boom.methodNotAllowed(undefined, undefined, ['GET', 'PUT']));
  }
};
