import type { ErrorResult, ErrorType, PromiseResult } from '@dossierhq/core';
import { createConsoleLogger, notOk } from '@dossierhq/core';
import type { NextApiResponse } from 'next';

const logger = createConsoleLogger(console);

function handleError<T>(res: NextApiResponse<T>, error: ErrorResult<unknown, ErrorType>): void {
  res.status(error.httpStatus).json({ message: error.message } as any);
}

export function sendMethodNotAllowedError<T>(
  res: NextApiResponse<T>,
  allowedMethods: ('GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE')[]
) {
  res.setHeader('Allow', allowedMethods.join(', '));
  res.status(405).end();
}

export async function handleRequest<T>(
  res: NextApiResponse<T>,
  handler: () => PromiseResult<T, ErrorType>
): Promise<void> {
  try {
    const bodyResult = await handler();
    if (bodyResult.isError()) {
      handleError(res, bodyResult);
      return;
    }
    // next.js built-in json conversion doesn't handle null (sends empty response)
    res
      .status(200)
      .setHeader('Content-Type', 'application/json; charset=utf-8')
      .send(JSON.stringify(bodyResult.value, null, 2) as unknown as T);
  } catch (error) {
    const result = notOk.GenericUnexpectedException({ logger }, error);
    handleError(res, result);
  }
}
