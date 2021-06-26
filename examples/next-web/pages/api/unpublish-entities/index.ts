import { EntityAdmin } from '@datadata/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { EntityUnpublishRequest } from '../../../types/RequestTypes';
import type { PublishingResultListResponse } from '../../../types/ResponseTypes';
import { errorResultToBoom } from '../../../utils/ErrorUtils';
import { handlePutAsync } from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

export default async (
  req: NextApiRequest,
  res: NextApiResponse<PublishingResultListResponse>
): Promise<void> => {
  await handlePutAsync(req, res, async (body: EntityUnpublishRequest) => {
    const { authContext, server } = await getServerConnection();
    const authResult = await getSessionContextForRequest(server, authContext, req);
    if (authResult.isError()) {
      throw errorResultToBoom(authResult);
    }
    const context = authResult.value;

    const unpublishResult = await EntityAdmin.unpublishEntities(context, body.items);
    if (unpublishResult.isError()) {
      throw errorResultToBoom(unpublishResult);
    }

    return unpublishResult.value;
  });
};
