import { EntityAdmin } from '@datadata/server';
import Joi from 'joi';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { ActionResponse } from '../../../types/ResponseTypes';
import { errorResultToBoom } from '../../../utils/ErrorUtils';
import { handlePutAsync, validateRequestQuery } from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

interface RequestQuery {
  id: string;
  version: number;
}
const requestSchema = Joi.object<RequestQuery>({
  id: Joi.string().required(),
  version: Joi.number().required(),
});

export default async (req: NextApiRequest, res: NextApiResponse<ActionResponse>): Promise<void> => {
  await handlePutAsync(req, res, async () => {
    const { authContext, server } = await getServerConnection();
    const authResult = await getSessionContextForRequest(server, authContext, req);
    if (authResult.isError()) {
      throw errorResultToBoom(authResult);
    }
    const context = authResult.value;

    const { id, version } = validateRequestQuery(req.query, requestSchema);

    const publishResult = await EntityAdmin.publishEntity(context, id, version);
    if (publishResult.isError()) {
      throw errorResultToBoom(publishResult);
    }

    return { success: true };
  });
};
