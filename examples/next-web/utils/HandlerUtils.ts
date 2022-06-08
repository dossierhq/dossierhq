import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { createConsoleLogger, createErrorResultFromError, ok } from '@jonasb/datadata-core';
import debug from 'debug';
import type { NextApiRequest, NextApiResponse } from 'next';

const debugWarn = debug('app:w:handler');
const logger = createConsoleLogger(console);

export function handleError<T>(res: NextApiResponse<T>, error: Error | unknown): void {
  const result = createErrorResultFromError({ logger }, error);

  sendErrorResponse(res, result.httpStatus, result.message);
}

function sendErrorResponse<T>(res: NextApiResponse<T>, httpStatus: number, message: string) {
  res.status(httpStatus).json({
    message,
  } as unknown as T);
}

export function sendMethodNotAllowedError<T>(
  res: NextApiResponse<T>,
  allowMethods: ('GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE')[]
) {
  sendErrorResponse(res, 405, 'Method Not allowed');
  res.setHeader('Allow', allowMethods.join(', '));
}

async function handleRequest<T>(
  res: NextApiResponse<T>,
  handler: () => PromiseResult<void, ErrorType>
) {
  try {
    const result = await handler();
    if (result.isError()) {
      sendErrorResponse(res, result.httpStatus, result.message);
    }
  } catch (error) {
    debugWarn('Failed request', error);
    handleError(res, error);
  }
}

export async function handleGet<T>(
  req: NextApiRequest,
  res: NextApiResponse<T>,
  handler: () => PromiseResult<T, ErrorType>
): Promise<void> {
  await handleRequest(res, async () => {
    if (req.method !== 'GET') {
      sendMethodNotAllowedError(res, ['GET']);
      return ok(undefined);
    }
    const bodyResult = await handler();
    if (bodyResult.isError()) return bodyResult;

    // next.js built-in json conversion doesn't handle null (sends empty response)
    res
      .status(200)
      .setHeader('Content-Type', 'application/json; charset=utf-8')
      .send(JSON.stringify(bodyResult.value, null, 2) as unknown as T);
    return ok(undefined);
  });
}

export async function handlePostWithoutLocation<T, R>(
  req: NextApiRequest,
  res: NextApiResponse<R>,
  handler: (body: T) => PromiseResult<R, ErrorType>
): Promise<void> {
  await handleRequest(res, async () => {
    if (req.method !== 'POST') {
      sendMethodNotAllowedError(res, ['POST']);
      return ok(undefined);
    }
    const result = await handler(req.body);
    if (result.isError()) return result;

    res.status(200).json(result.value);
    return ok(undefined);
  });
}

export async function handlePut<T, R>(
  req: NextApiRequest,
  res: NextApiResponse<R>,
  handler: (body: T) => PromiseResult<R, ErrorType>
): Promise<void> {
  await handleRequest(res, async () => {
    if (req.method !== 'PUT') {
      sendMethodNotAllowedError(res, ['PUT']);
      return ok(undefined);
    }
    const bodyResult = await handler(req.body);
    if (bodyResult.isError()) return bodyResult;

    res.status(200).json(bodyResult.value);
    return ok(undefined);
  });
}
