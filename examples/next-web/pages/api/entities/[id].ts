import { EntityAdmin } from '@datadata/server';
import Boom from '@hapi/boom';
import Joi from 'joi';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { EntityResponse } from '../../../types/ResponseTypes';
import { errorResultToBoom } from '../../../utils/ErrorUtils';
import { handleError, handleGetAsync, validateRequestQuery } from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

interface RequestQuery {
  id: string;
}
const requestSchema = Joi.object<RequestQuery>({ id: Joi.string() });

export default async (req: NextApiRequest, res: NextApiResponse<EntityResponse>): Promise<void> => {
  if (req.method === 'GET') {
    await handleGetAsync(req, res, async () => {
      const { id } = validateRequestQuery(req.query, requestSchema);
      const { authContext, server } = await getServerConnection();
      const authResult = await getSessionContextForRequest(server, authContext, req);
      if (authResult.isError()) {
        throw errorResultToBoom(authResult);
      }
      const context = authResult.value;
      const result = await EntityAdmin.getEntity(context, id, {});
      if (result.isError()) {
        throw errorResultToBoom(result);
      }
      return result.value;
    });
  } else {
    handleError(res, Boom.badRequest());
  }
};
