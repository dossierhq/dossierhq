import type { ErrorType, PromiseResult } from '.';
import { assertIsDefined } from './Asserts';

export type ContextProvider<TContext> = () => PromiseResult<{ context: TContext }, ErrorType>;

export interface Operation<TName, TArgs, TResult> {
  readonly name: TName;
  readonly args: TArgs;
  readonly modifies: boolean;
  readonly resolve: (result: TResult) => void;
  readonly next: () => Promise<TResult>;
}

export type OperationWithoutCallbacks<T> = Omit<T, 'resolve' | 'next'>;

export interface Middleware<TContext, TOp> {
  (context: TContext, operation: TOp): Promise<void>;
}

export async function executeOperationPipeline<
  TContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TMiddleware extends Middleware<TContext, any>,
  TName,
  TArgs,
  TResult,
  TOp extends Operation<TName, TArgs, TResult>
>(
  context: TContext,
  pipeline: TMiddleware[],
  operation: OperationWithoutCallbacks<TOp>
): Promise<TResult> {
  if (pipeline.length === 0) {
    throw new Error('Cannot execute an empty pipeline');
  }
  return await executeOperationMiddleware(context, pipeline, 0, operation);
}

async function executeOperationMiddleware<
  TContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TMiddleware extends Middleware<TContext, any>,
  TName,
  TArgs,
  TResult,
  TOp extends Operation<TName, TArgs, TResult>
>(
  context: TContext,
  pipeline: TMiddleware[],
  pipelineIndex: number,
  operation: OperationWithoutCallbacks<TOp>
): Promise<TResult> {
  // Setup callbacks
  let result: TResult | undefined;
  const resolve = (res: TResult) => (result = res);

  const next = async () => {
    if (pipelineIndex >= pipeline.length - 1) {
      throw new Error('The last middleware in the pipeline cannot call next()');
    }
    const nextResult = await executeOperationMiddleware(
      context,
      pipeline,
      pipelineIndex + 1,
      operation
    );
    return nextResult;
  };

  const operationWithCallbacks = { ...operation, resolve, next } as unknown as TOp;

  // Execute the middleware in pipelineIndex
  await pipeline[pipelineIndex](context, operationWithCallbacks);
  assertIsDefined(result);

  return result;
}
