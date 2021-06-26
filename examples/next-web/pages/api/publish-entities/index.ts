import type { NextApiRequest, NextApiResponse } from 'next';
import type { EntityPublishRequest } from '../../../types/RequestTypes';
import type { PublishingResultListResponse } from '../../../types/ResponseTypes';
import { errorResultToBoom } from '../../../utils/ErrorUtils';
import { handlePutAsync } from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

export default async (
  req: NextApiRequest,
  res: NextApiResponse<PublishingResultListResponse>
): Promise<void> => {
  await handlePutAsync(req, res, async (body: EntityPublishRequest) => {
    const { authContext, server } = await getServerConnection();
    const authResult = await getSessionContextForRequest(server, authContext, req);
    if (authResult.isError()) {
      throw errorResultToBoom(authResult);
    }
    const { adminClient } = authResult.value;

    const publishResult = await adminClient.publishEntities(body.items);
    if (publishResult.isError()) {
      throw errorResultToBoom(publishResult);
    }

    return publishResult.value;
  });
};
