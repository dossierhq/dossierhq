import { EntityAdmin } from '@datadata/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { SearchEntitiesResponse } from '../../types/ResponseTypes';
import { errorResultToBoom } from '../../utils/ErrorUtils';
import { handleGetAsync } from '../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../utils/ServerUtils';

export default async (
  req: NextApiRequest,
  res: NextApiResponse<SearchEntitiesResponse>
): Promise<void> => {
  await handleGetAsync(req, res, async () => {
    const { authContext, server } = await getServerConnection();
    const authResult = await getSessionContextForRequest(server, authContext, req);
    if (authResult.isError()) {
      throw errorResultToBoom(authResult);
    }
    const context = authResult.value;

    const searchResult = await EntityAdmin.searchEntities(context);
    if (searchResult.isError()) {
      throw errorResultToBoom(searchResult);
    }
    return searchResult.value;
  });
};
