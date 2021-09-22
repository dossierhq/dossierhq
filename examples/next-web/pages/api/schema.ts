import type { NextApiRequest, NextApiResponse } from 'next';
import type { SchemaResponse } from '../../types/ResponseTypes';
import { handleGet } from '../../utils/HandlerUtils';
import { getServerConnection } from '../../utils/ServerUtils';

export default async function schemaHandler(
  req: NextApiRequest,
  res: NextApiResponse<SchemaResponse>
): Promise<void> {
  await handleGet(req, res, async () => {
    const { schema } = await getServerConnection();
    return { spec: schema.spec };
  });
}
