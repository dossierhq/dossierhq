import { NoOpLogger, ok } from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import { Mutex } from './MutexUtils.js';

const context = { logger: NoOpLogger };

describe('Mutex', () => {
  test('two locks do not overlap', async () => {
    const mutex = new Mutex();
    const messages: string[] = [];

    await Promise.all([
      mutex.withLock(context, async () => {
        messages.push('1-a');
        await new Promise((resolve) => setTimeout(resolve, 10));
        messages.push('1-b');
        return ok(undefined);
      }),
      mutex.withLock(context, async () => {
        messages.push('2');
        return ok(undefined);
      }),
    ]);

    expect(messages).toEqual(['1-a', '1-b', '2']);
  });
});
