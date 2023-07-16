import { NoOpLogger, ok } from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import { Mutex } from './MutexUtils.js';

const context = { logger: NoOpLogger };

describe('Mutex', () => {
  test('two locks do not overlap', async () => {
    const mutex = new Mutex();
    const messages: string[] = [];

    expect(mutex.isLocked()).toBe(false);

    await Promise.all([
      mutex.withLock(context, async () => {
        expect(mutex.isLocked()).toBe(true);

        messages.push('1-a');
        await new Promise((resolve) => setTimeout(resolve, 10));
        messages.push('1-b');
        return ok(undefined);
      }),
      mutex.withLock(context, () => {
        expect(mutex.isLocked()).toBe(true);

        messages.push('2');
        return Promise.resolve(ok(undefined));
      }),
    ]);

    expect(mutex.isLocked()).toBe(false);

    expect(messages).toEqual(['1-a', '1-b', '2']);
  });
});
