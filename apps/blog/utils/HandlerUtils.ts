import type { ServerResponse } from 'http';
import {
  createConsoleLogger,
  notOk,
  type ErrorResult,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { NextApiResponse } from 'next';

const logger = createConsoleLogger(console);

const ContentTypes = {
  'text/plain': 'text/plain; charset=UTF-8',
};

// in seconds
const CacheDurations = {
  minute: { maxAge: 60, swr: 120 },
  hour: { maxAge: 60 * 60, swr: 4 * 60 * 60 },
} satisfies Record<string, { maxAge: number; swr: number }>;

function handleError<T>(res: NextApiResponse<T>, error: ErrorResult<unknown, ErrorType>): void {
  res.status(error.httpStatus).json({ message: error.message } as any);
}

export function sendMethodNotAllowedError<T>(
  res: NextApiResponse<T>,
  allowedMethods: ('GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE')[],
) {
  res.setHeader('Allow', allowedMethods.join(', '));
  res.status(405).end();
}

export async function handleRequest<T>(
  res: NextApiResponse<T>,
  handler: () => PromiseResult<T, ErrorType>,
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

export function setHeaderContentType(res: ServerResponse, contentType: keyof typeof ContentTypes) {
  res.setHeader('Content-Type', ContentTypes[contentType]);
}

export function setHeaderCacheControlPublic(
  res: ServerResponse,
  duration: keyof typeof CacheDurations,
) {
  const cacheDuration = CacheDurations[duration];
  res.setHeader(
    'Cache-Control',
    `public, s-maxage=${cacheDuration.maxAge}, stale-while-revalidate=${cacheDuration.swr}`,
  );
}
