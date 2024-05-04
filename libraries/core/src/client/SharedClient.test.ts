import { describe, test } from 'vitest';
import { ErrorType, ok } from '../ErrorResult.js';
import { NoOpLogger } from '../Logger.js';
import { expectErrorResult, expectResultValue } from '../test/CoreTestUtils.js';
import {
  executeOperationPipeline,
  type ClientContext,
  type Middleware,
  type Operation,
  type OperationWithoutCallbacks,
} from './SharedClient.js';

const TestClientOperationName = {
  foo: 'foo',
} as const;
type TestClientOperationName =
  (typeof TestClientOperationName)[keyof typeof TestClientOperationName];

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
  operation: OperationWithoutCallbacks<TestClientOperation<TestClientOperationName>>,
) {
  return await executeOperationPipeline(context, pipeline, operation);
}

describe('executeOperationPipeline()', () => {
  test('One middleware returning argument', async () => {
    const result = await executeTestPipeline(
      { logger: NoOpLogger },
      [
        (_context, operation) => {
          if (operation.name === TestClientOperationName.foo) {
            const {
              args: [firstArg],
              resolve,
            } = operation;
            resolve(ok({ item: firstArg }));
          }
          return Promise.resolve();
        },
      ],
      { name: TestClientOperationName.foo, args: ['hello'], modifies: false },
    );
    expectResultValue(result, { item: 'hello' });
  });

  test('Two middlewares, the first modifies the second', async () => {
    const result = await executeTestPipeline(
      { logger: NoOpLogger },
      [
        async (_context, operation) => {
          if (operation.name === TestClientOperationName.foo) {
            const { resolve } = operation;
            const result = await operation.next();
            // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
            resolve(ok({ item: `[[[${result.isOk() ? result.value.item : result}]]]` }));
          }
        },
        (_context, operation) => {
          if (operation.name === TestClientOperationName.foo) {
            const {
              args: [firstArg],
              resolve,
            } = operation;
            resolve(ok({ item: firstArg }));
          }
          return Promise.resolve();
        },
      ],
      { name: TestClientOperationName.foo, args: ['hello'], modifies: false },
    );
    expectResultValue(result, { item: '[[[hello]]]' });
  });

  test('Error: Middleware throwing exception', async () => {
    const result = await executeTestPipeline(
      { logger: NoOpLogger },
      [
        (_context, _operation) => {
          return Promise.reject(new Error('Error message'));
        },
      ],
      { name: TestClientOperationName.foo, args: ['hello'], modifies: false },
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
      { name: TestClientOperationName.foo, args: ['hello'], modifies: false },
    );
    expectErrorResult(
      result,
      ErrorType.Generic,
      'The last middleware in the pipeline cannot call next()',
    );
  });
});
