import Boom from '@hapi/boom';
import { executeAdminClientOperationFromJson } from '@jonasb/datadata-core';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { AdminOperationRequest } from '../../types/RequestTypes';
import { errorResultToBoom } from '../../utils/ErrorUtils';
import { handleError, handlePutAsync } from '../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../utils/ServerUtils';

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  if (req.method === 'PUT') {
    await handlePutAsync(req, res, async (body: AdminOperationRequest) => {
      const { authContext, server } = await getServerConnection();
      const authResult = await getSessionContextForRequest(server, authContext, req);
      if (authResult.isError()) {
        throw errorResultToBoom(authResult);
      }
      const { adminClient } = authResult.value;

      const result = await executeAdminClientOperationFromJson(adminClient, body);
      if (result.isError()) {
        throw errorResultToBoom(result);
      }
      return result.value;
    });
  } else {
    handleError(res, Boom.methodNotAllowed(undefined, undefined, ['PUT']));
  }
};
