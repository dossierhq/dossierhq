import type { AdminQuery } from '@datadata/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { TotalCountResponse } from '../../types/ResponseTypes';
import { errorResultToBoom } from '../../utils/ErrorUtils';
import { handleGetAsync } from '../../utils/HandlerUtils';
import { decodeQuery } from '../../utils/QueryUtils';
import { getServerConnection, getSessionContextForRequest } from '../../utils/ServerUtils';

export default async (
  req: NextApiRequest,
  res: NextApiResponse<TotalCountResponse>
): Promise<void> => {
  await handleGetAsync(req, res, async () => {
    const { authContext, server } = await getServerConnection();
    const authResult = await getSessionContextForRequest(server, authContext, req);
    if (authResult.isError()) {
      throw errorResultToBoom(authResult);
    }
    const { adminClient } = authResult.value;

    const query = decodeQuery<AdminQuery>('query', req.query);

    const searchResult = await adminClient.getTotalCount(query);
    if (searchResult.isError()) {
      throw errorResultToBoom(searchResult);
    }
    return { totalCount: searchResult.value };
  });
};
