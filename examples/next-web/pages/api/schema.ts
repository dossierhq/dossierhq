import type { SchemaSpecification } from '@datadata/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import { handleGetAsync } from '../../utils/HandlerUtils';
import { getServerConnection } from '../../utils/ServerUtils';

export default async (
  req: NextApiRequest,
  res: NextApiResponse<SchemaSpecification>
): Promise<void> => {
  await handleGetAsync(req, res, async () => {
    const { server } = await getServerConnection();
    const schema = server.getSchema();
    return schema.spec;
  });
};
