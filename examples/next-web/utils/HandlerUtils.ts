import Boom from '@hapi/boom';
import debug from 'debug';
import type { ObjectSchema } from 'joi';
import Joi from 'joi';
import type { NextApiResponse, NextApiRequest } from 'next';

const debugWarn = debug('app:w:handler');

export function validateRequestQuery<T>(
  value: NextApiRequest['query'],
  schema: ObjectSchema<T>
): T {
  try {
    return Joi.attempt(value, schema);
  } catch (error) {
    debugWarn('Failed validation', error.message);
    throw Boom.badRequest();
  }
}

export function handleError<T>(res: NextApiResponse<T>, error: Error): void {
  const boomError = Boom.boomify(error);
  for (const [name, value] of Object.entries(boomError.output.headers)) {
    res.setHeader(name, value ?? '');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.status(boomError.output.statusCode).json(boomError.output.payload as any);
}

async function handleAsync<T>(res: NextApiResponse<T>, handler: () => Promise<void>) {
  try {
    await handler();
  } catch (error) {
    debugWarn('Failed request', error);
    handleError(res, error);
  }
}

export async function handleGetAsync<T>(
  req: NextApiRequest,
  res: NextApiResponse<T>,
  handler: () => Promise<T>
): Promise<void> {
  await handleAsync(res, async () => {
    if (req.method !== 'GET') {
      throw Boom.methodNotAllowed(undefined, undefined, 'GET');
    }
    const body = await handler();
    res.status(200).json(body);
  });
}

export async function handlePostAsync<T, R>(
  req: NextApiRequest,
  res: NextApiResponse<R>,
  handler: (body: T) => Promise<{ location: string; body: R }>
): Promise<void> {
  await handleAsync(res, async () => {
    if (req.method !== 'POST') {
      throw Boom.methodNotAllowed(undefined, undefined, 'POST');
    }
    const { location, body: responseBody } = await handler(req.body);
    res.setHeader('Location', location);
    res.status(201).json(responseBody);
  });
}

export async function handlePutAsync<T, R>(
  req: NextApiRequest,
  res: NextApiResponse<R>,
  handler: (body: T) => Promise<R>
): Promise<void> {
  await handleAsync(res, async () => {
    if (req.method !== 'PUT') {
      throw Boom.methodNotAllowed(undefined, undefined, 'PUT');
    }
    const responseBody = await handler(req.body);
    res.status(200).json(responseBody);
  });
}
