import type { JsonEntityHistory } from '@datadata/core';
import { EntityAdmin } from '@datadata/server';
import Joi from 'joi';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { EntityHistoryResponse } from '../../../types/ResponseTypes';
import { errorResultToBoom } from '../../../utils/ErrorUtils';
import { handleGetAsync, validateRequestQuery } from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

interface RequestQuery {
  id: string;
}
const requestSchema = Joi.object<RequestQuery>({
  id: Joi.string().required(),
});

export default async (
  req: NextApiRequest,
  res: NextApiResponse<EntityHistoryResponse>
): Promise<void> => {
  await handleGetAsync(req, res, async () => {
    const { id } = validateRequestQuery(req.query, requestSchema);

    const { authContext, server } = await getServerConnection();
    const authResult = await getSessionContextForRequest(server, authContext, req);
    if (authResult.isError()) {
      throw errorResultToBoom(authResult);
    }
    const context = authResult.value;

    const result = await EntityAdmin.getEntityHistory(context, id);
    if (result.isError()) {
      throw errorResultToBoom(result);
    }
    return result.value as unknown as JsonEntityHistory;
  });
};
