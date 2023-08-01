import type { TestFunction, TestFunctionInitializer, TestSuite } from './index.js';

export type UnboundTestFunction<TContext> = ((context: TContext) => void | Promise<void>) & {
  timeout?: 'long';
};

export function buildSuite<TContext, TCleanup>(
  context: TestFunctionInitializer<TContext, TCleanup>,
  ...testFunctions: UnboundTestFunction<TContext>[]
): TestSuite {
  const suite: TestSuite = {};
  for (const testFunction of testFunctions) {
    const boundTestFunction: TestFunction = async () => {
      const [functionContext, cleanup] = await context.before();
      try {
        await testFunction(functionContext);
      } finally {
        await context.after(cleanup);
      }
    };
    if (testFunction.timeout !== undefined) {
      boundTestFunction.timeout = testFunction.timeout;
    }
    suite[testFunction.name] = boundTestFunction;
  }
  return suite;
}
