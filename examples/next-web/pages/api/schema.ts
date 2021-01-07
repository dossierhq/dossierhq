import type { NextApiRequest, NextApiResponse } from 'next';
import type { SchemaResponse } from '../../types/ResponseTypes';
import { handleGetAsync } from '../../utils/HandlerUtils';
import { getServerConnection } from '../../utils/ServerUtils';

export default async (req: NextApiRequest, res: NextApiResponse<SchemaResponse>): Promise<void> => {
  await handleGetAsync(req, res, async () => {
    const { server } = await getServerConnection();
    const schema = server.getSchema();
    return { spec: schema.spec };
  });
};
