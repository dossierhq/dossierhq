import type { TransactionContext } from '@dossierhq/database-adapter';

export async function withQueryPerformance<T>(
  context: TransactionContext,
  text: string,
  callback: () => Promise<T>,
): Promise<T> {
  const startTime = performance.now();
  let success = false;

  try {
    const result = await callback();

    success = true;

    const duration = performance.now() - startTime;
    context.databasePerformance?.onQueryCompleted(text, success, duration);

    return result;
  } finally {
    if (!success) {
      const duration = performance.now() - startTime;
      context.databasePerformance?.onQueryCompleted(text, success, duration);
    }
  }
}
