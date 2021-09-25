import type { ErrorType, Logger, PromiseResult, Result } from '.';
import { assertIsDefined } from './Asserts';

export type ContextProvider<TContext> = () => PromiseResult<{ context: TContext }, ErrorType>;

export interface Operation<TName, TArgs, TOk, TError extends ErrorType | ErrorType.Generic> {
  readonly name: TName;
  readonly args: TArgs;
  readonly modifies: boolean;
  readonly resolve: (result: Result<TOk, TError>) => void;
  readonly next: () => Promise<Result<TOk, TError>>;
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
  TOk,
  TError extends ErrorType.Generic,
  TOp extends Operation<TName, TArgs, TOk, TError>
>(
  context: TContext,
  pipeline: TMiddleware[],
  operation: OperationWithoutCallbacks<TOp>
): Promise<Result<TOk, TError>> {
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
  TOk,
  TError extends ErrorType.Generic,
  TOp extends Operation<TName, TArgs, TOk, TError>
>(
  context: TContext,
  pipeline: TMiddleware[],
  pipelineIndex: number,
  operation: OperationWithoutCallbacks<TOp>
): Promise<Result<TOk, TError>> {
  // Setup callbacks
  let result: Result<TOk, TError> | undefined;
  const resolve = (res: Result<TOk, TError>) => (result = res);

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

export async function LoggingClientMiddleware<
  TContext extends { logger: Logger },
  TOk,
  TError extends ErrorType.Generic,
  TOp extends Operation<unknown, unknown, TOk, TError>
>(context: TContext, operation: TOp): Promise<void> {
  const { logger } = context;
  logger.info('Executing %s: %O', operation.name, operation.args);
  const result = await operation.next();
  if (result.isError()) {
    logger.warn('Result %s error: %s: %s', operation.name, result.error, result.message);
  } else {
    // Add effect to log, effect is just a convention, not a formal part of OkResult
    const effect =
      typeof result.value === 'object' && (result.value as { effect?: unknown }).effect;
    if (typeof effect === 'string') {
      logger.info('Result %s ok, effect %s', operation.name, effect);
    } else {
      logger.info('Result %s ok', operation.name);
    }
  }
  operation.resolve(result);
}
