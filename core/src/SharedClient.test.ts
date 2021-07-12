import type { Middleware, Operation, OperationWithoutCallbacks } from './SharedClient';
import { executeOperationPipeline } from './SharedClient';

interface TestClientOperationArguments {
  [TestClientOperationName.foo]: [string];
}

interface TestClientOperationReturn {
  [TestClientOperationName.foo]: { item: string };
}

enum TestClientOperationName {
  foo = 'foo',
}

type TestClientOperation<TName extends TestClientOperationName> = Operation<
  TName,
  TestClientOperationArguments[TName],
  TestClientOperationReturn[TName]
>;

type TestClientMiddleware<TContext> = Middleware<
  TContext,
  TestClientOperation<TestClientOperationName>
>;

async function executeTestPipeline<TContext>(
  context: TContext,
  pipeline: TestClientMiddleware<TContext>[],
  operation: OperationWithoutCallbacks<TestClientOperation<TestClientOperationName>>
) {
  return await executeOperationPipeline(context, pipeline, operation);
}

describe('executeOperationPipeline()', () => {
  test('One middleware returning argument', async () => {
    expect(
      await executeTestPipeline(
        {},
        [
          async (_context, operation) => {
            if (operation.name === TestClientOperationName.foo) {
              const {
                args: [firstArg],
                resolve,
              } = operation as TestClientOperation<TestClientOperationName.foo>;
              resolve({ item: firstArg });
            }
          },
        ],
        { name: TestClientOperationName.foo, args: ['hello'] }
      )
    ).toEqual({ item: 'hello' });
  });

  test('Two middlewares, the first modifies the second', async () => {
    expect(
      await executeTestPipeline(
        {},
        [
          async (_context, operation) => {
            if (operation.name === TestClientOperationName.foo) {
              const { resolve } = operation as TestClientOperation<TestClientOperationName.foo>;
              resolve({ item: `[[[${(await operation.next()).item}]]]` });
            }
          },
          async (_context, operation) => {
            if (operation.name === TestClientOperationName.foo) {
              const {
                args: [firstArg],
                resolve,
              } = operation as TestClientOperation<TestClientOperationName.foo>;
              resolve({ item: firstArg });
            }
          },
        ],
        { name: TestClientOperationName.foo, args: ['hello'] }
      )
    ).toEqual({ item: '[[[hello]]]' });
  });

  test('Error: empty pipeline', async () => {
    await expect(
      executeTestPipeline({}, [], { name: TestClientOperationName.foo, args: ['hello'] })
    ).rejects.toThrowError('Cannot execute an empty pipeline');
  });

  test('Error: final middleware calling next()', async () => {
    await expect(
      executeTestPipeline(
        {},
        [async (_context, operation) => operation.resolve(await operation.next())],
        { name: TestClientOperationName.foo, args: ['hello'] }
      )
    ).rejects.toThrowError('The last middleware in the pipeline cannot call next()');
  });
});
