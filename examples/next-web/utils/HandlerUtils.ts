import Boom from '@hapi/boom';
import debug from 'debug';
import type { ObjectSchema } from 'joi';
import Joi from 'joi';
import type { NextApiRequest, NextApiResponse } from 'next';

const debugWarn = debug('app:w:handler');

export function validateRequestQuery<T>(
  value: NextApiRequest['query'],
  schema: ObjectSchema<T>
): T {
  try {
    return Joi.attempt(value, schema);
  } catch (error) {
    debugWarn('Failed validation', error instanceof Error ? error.message : error);
    throw Boom.badRequest();
  }
}

export function handleError<T>(res: NextApiResponse<T>, error: Error | unknown): void {
  const boomError = Boom.boomify(error instanceof Error ? error : new Error());
  for (const [name, value] of Object.entries(boomError.output.headers)) {
    res.setHeader(name, value ?? '');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.status(boomError.output.statusCode).json(boomError.output.payload as any);
}

async function handleRequest<T>(res: NextApiResponse<T>, handler: () => Promise<void>) {
  try {
    await handler();
  } catch (error) {
    debugWarn('Failed request', error);
    handleError(res, error);
  }
}

export async function handleGet<T>(
  req: NextApiRequest,
  res: NextApiResponse<T>,
  handler: () => Promise<T>
): Promise<void> {
  await handleRequest(res, async () => {
    if (req.method !== 'GET') {
      throw Boom.methodNotAllowed(undefined, undefined, 'GET');
    }
    const body = await handler();
    // next.js built-in json conversion doesn't handle null (sends empty response)
    res
      .status(200)
      .setHeader('Content-Type', 'application/json; charset=utf-8')
      .send(JSON.stringify(body, null, 2) as unknown as T);
  });
}

export async function handlePostWithoutLocation<T, R>(
  req: NextApiRequest,
  res: NextApiResponse<R>,
  handler: (body: T) => Promise<R>
): Promise<void> {
  await handleRequest(res, async () => {
    if (req.method !== 'POST') {
      throw Boom.methodNotAllowed(undefined, undefined, 'POST');
    }
    const result = await handler(req.body);
    res.status(200).json(result);
  });
}

export async function handlePut<T, R>(
  req: NextApiRequest,
  res: NextApiResponse<R>,
  handler: (body: T) => Promise<R>
): Promise<void> {
  await handleRequest(res, async () => {
    if (req.method !== 'PUT') {
      throw Boom.methodNotAllowed(undefined, undefined, 'PUT');
    }
    const responseBody = await handler(req.body);
    res.status(200).json(responseBody);
  });
}
