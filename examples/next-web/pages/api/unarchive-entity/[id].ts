import { EntityAdmin } from '@datadata/server';
import Joi from 'joi';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { EntityUnarchiveRequest } from '../../../types/RequestTypes';
import type { ActionResponse } from '../../../types/ResponseTypes';
import { errorResultToBoom } from '../../../utils/ErrorUtils';
import { handlePutAsync, validateRequestQuery } from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

interface RequestQuery {
  id: string;
}
const requestSchema = Joi.object<RequestQuery>({
  id: Joi.string().required(),
});

export default async (req: NextApiRequest, res: NextApiResponse<ActionResponse>): Promise<void> => {
  await handlePutAsync(req, res, async (_body: EntityUnarchiveRequest) => {
    const { id } = validateRequestQuery(req.query, requestSchema);

    const { authContext, server } = await getServerConnection();
    const authResult = await getSessionContextForRequest(server, authContext, req);
    if (authResult.isError()) {
      throw errorResultToBoom(authResult);
    }
    const context = authResult.value;

    const unarchiveResult = await EntityAdmin.unarchiveEntity(context, id);
    if (unarchiveResult.isError()) {
      throw errorResultToBoom(unarchiveResult);
    }

    return { success: true };
  });
};
