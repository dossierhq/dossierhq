import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk } from '@dossierhq/core';
import type { Context } from '@dossierhq/database-adapter';

export class Mutex {
  #locking: Promise<void>;
  #queueCount: number;

  constructor() {
    this.#locking = Promise.resolve();
    this.#queueCount = 0;
  }

  #lock() {
    this.#queueCount++;
    let unlockNext: (value: void) => void;

    const willLock: Promise<void> = new Promise((resolve) => (unlockNext = resolve));
    willLock.then(() => this.#queueCount--);

    const willUnlock: Promise<() => void> = this.#locking.then(() => unlockNext);

    this.#locking = this.#locking.then(() => willLock);

    return willUnlock;
  }

  isLocked(): boolean {
    return this.#queueCount > 0;
  }

  async withLock<TOk, TError extends ErrorType>(
    context: Context,
    worker: () => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError | typeof ErrorType.Generic> {
    const unlock = await this.#lock();
    try {
      return await worker();
    } catch (error) {
      return notOk.GenericUnexpectedException(context, error);
    } finally {
      unlock();
    }
  }
}
