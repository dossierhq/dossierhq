import { toAdminEntity1, toAdminEntityCreate2 } from '@datadata/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { EntityCreateRequest } from '../../../types/RequestTypes';
import type { EntityResponse } from '../../../types/ResponseTypes';
import * as BackendUtils from '../../../utils/BackendUtils';
import { errorResultToBoom } from '../../../utils/ErrorUtils';
import { handlePostAsync } from '../../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../../utils/ServerUtils';

export default async (req: NextApiRequest, res: NextApiResponse<EntityResponse>): Promise<void> => {
  await handlePostAsync(req, res, async (body: EntityCreateRequest) => {
    const { authContext, server } = await getServerConnection();
    const authResult = await getSessionContextForRequest(server, authContext, req);
    if (authResult.isError()) {
      throw errorResultToBoom(authResult);
    }
    const { adminClient } = authResult.value;

    const result = await adminClient.createEntity(toAdminEntityCreate2(body.item));

    if (result.isError()) {
      throw errorResultToBoom(result);
    }
    return {
      location: BackendUtils.urls.getEntity(result.value.id),
      body: { item: toAdminEntity1(result.value) },
    };
  });
};
