import type { TestFunctionInitializer, TestSuite } from './index.js';

export type UnboundTestFunction<TContext> = (context: TContext) => void | Promise<void>;

export function buildSuite<TContext, TCleanup>(
  context: TestFunctionInitializer<TContext, TCleanup>,
  ...testFunctions: UnboundTestFunction<TContext>[]
): TestSuite {
  const suite: TestSuite = {};
  for (const testFunction of testFunctions) {
    suite[testFunction.name] = async () => {
      const [functionContext, cleanup] = await context.before();
      try {
        await testFunction(functionContext);
      } finally {
        await context.after(cleanup);
      }
    };
  }
  return suite;
}
