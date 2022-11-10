import { describe, test } from 'vitest';
import { expectErrorResult, expectResultValue } from './CoreTestUtils.js';
import { ErrorType, ok } from './ErrorResult.js';
import { NoOpLogger } from './Logger.js';
import type {
  ClientContext,
  Middleware,
  Operation,
  OperationWithoutCallbacks,
} from './SharedClient.js';
import { executeOperationPipeline } from './SharedClient.js';

const TestClientOperationName = {
  foo: 'foo',
} as const;
type TestClientOperationName = typeof TestClientOperationName[keyof typeof TestClientOperationName];

interface TestClientOperationArguments {
  [TestClientOperationName.foo]: [string];
}

interface TestClientOperationReturnOk {
  [TestClientOperationName.foo]: { item: string };
}

interface TestClientOperationReturnError {
  [TestClientOperationName.foo]: typeof ErrorType.BadRequest | typeof ErrorType.Generic;
}

type TestClientOperation<TName extends TestClientOperationName> = Operation<
  TName,
  TestClientOperationArguments[TName],
  TestClientOperationReturnOk[TName],
  TestClientOperationReturnError[TName]
>;

type TestClientMiddleware<TContext extends ClientContext> = Middleware<
  TContext,
  TestClientOperation<TestClientOperationName>
>;

async function executeTestPipeline<TContext extends ClientContext>(
  context: TContext,
  pipeline: TestClientMiddleware<TContext>[],
  operation: OperationWithoutCallbacks<TestClientOperation<TestClientOperationName>>
) {
  return await executeOperationPipeline(context, pipeline, operation);
}

describe('executeOperationPipeline()', () => {
  test('One middleware returning argument', async () => {
    const result = await executeTestPipeline(
      { logger: NoOpLogger },
      [
        async (_context, operation) => {
          if (operation.name === TestClientOperationName.foo) {
            const {
              args: [firstArg],
              resolve,
            } = operation as TestClientOperation<typeof TestClientOperationName.foo>;
            resolve(ok({ item: firstArg }));
          }
        },
      ],
      { name: TestClientOperationName.foo, args: ['hello'], modifies: false }
    );
    expectResultValue(result, { item: 'hello' });
  });

  test('Two middlewares, the first modifies the second', async () => {
    const result = await executeTestPipeline(
      { logger: NoOpLogger },
      [
        async (_context, operation) => {
          if (operation.name === TestClientOperationName.foo) {
            const { resolve } = operation as TestClientOperation<
              typeof TestClientOperationName.foo
            >;
            const result = await operation.next();
            resolve(ok({ item: `[[[${result.isOk() ? result.value.item : result}]]]` }));
          }
        },
        async (_context, operation) => {
          if (operation.name === TestClientOperationName.foo) {
            const {
              args: [firstArg],
              resolve,
            } = operation as TestClientOperation<typeof TestClientOperationName.foo>;
            resolve(ok({ item: firstArg }));
          }
        },
      ],
      { name: TestClientOperationName.foo, args: ['hello'], modifies: false }
    );
    expectResultValue(result, { item: '[[[hello]]]' });
  });

  test('Error: Middleware throwing exception', async () => {
    const result = await executeTestPipeline(
      { logger: NoOpLogger },
      [
        async (_context, _operation) => {
          throw new Error('Error message');
        },
      ],
      { name: TestClientOperationName.foo, args: ['hello'], modifies: false }
    );
    expectErrorResult(result, ErrorType.Generic, 'Unexpected exception: Error: Error message');
  });

  test('Error: empty pipeline', async () => {
    const result = await executeTestPipeline({ logger: NoOpLogger }, [], {
      name: TestClientOperationName.foo,
      args: ['hello'],
      modifies: false,
    });
    expectErrorResult(result, ErrorType.Generic, 'Cannot execute an empty pipeline');
  });

  test('Error: final middleware calling next()', async () => {
    const result = await executeTestPipeline(
      { logger: NoOpLogger },
      [async (_context, operation) => operation.resolve(await operation.next())],
      { name: TestClientOperationName.foo, args: ['hello'], modifies: false }
    );
    expectErrorResult(
      result,
      ErrorType.Generic,
      'The last middleware in the pipeline cannot call next()'
    );
  });
});
