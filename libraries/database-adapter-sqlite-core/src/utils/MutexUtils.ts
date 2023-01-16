import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk } from '@dossierhq/core';
import type { Context } from '@jonasb/datadata-database-adapter';

export class Mutex {
  #locking: Promise<void>;
  #locked: boolean;

  constructor() {
    this.#locking = Promise.resolve();
    this.#locked = false;
  }

  #lock() {
    this.#locked = true;
    let unlockNext: (value: void) => void;
    const willLock: Promise<void> = new Promise((resolve) => (unlockNext = resolve));
    willLock.then(() => (this.#locked = false));
    const willUnlock: Promise<() => void> = this.#locking.then(() => unlockNext);
    this.#locking = this.#locking.then(() => willLock);
    return willUnlock;
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
