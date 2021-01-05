import type { NextApiRequest, NextApiResponse } from 'next';

export default (req: NextApiRequest, res: NextApiResponse<{ name: string }>): void => {
  res.statusCode = 200;
  res.json({ name: 'John Doe' });
};
