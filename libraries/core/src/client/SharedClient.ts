import { assertIsDefined } from '../Asserts.js';
import type { ErrorType, PromiseResult, Result } from '../ErrorResult.js';
import { notOk } from '../ErrorResult.js';
import type { Logger } from '../Logger.js';

export interface ClientContext {
  logger: Logger;
}

export type ContextProvider<TContext extends ClientContext> = () => PromiseResult<
  { context: TContext },
  ErrorType
>;

export interface Operation<
  TName,
  TArgs,
  TOk,
  TError extends ErrorType | typeof ErrorType.Generic,
  TModifies extends boolean = boolean,
> {
  readonly name: TName;
  readonly args: TArgs;
  readonly modifies: TModifies;
  readonly resolve: (result: Result<TOk, TError>) => void;
  readonly next: () => Promise<Result<TOk, TError>>;
}

export type OperationWithoutCallbacks<T> = Omit<T, 'resolve' | 'next'>;

export type Middleware<TContext extends ClientContext, TOp> = (
  context: TContext,
  operation: TOp,
) => Promise<void>;

export async function executeOperationPipeline<
  TContext extends ClientContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TMiddleware extends Middleware<TContext, any>,
  TName,
  TArgs,
  TOk,
  TError extends typeof ErrorType.Generic,
  TOp extends Operation<TName, TArgs, TOk, TError>,
>(
  context: TContext,
  pipeline: TMiddleware[],
  operation: OperationWithoutCallbacks<TOp>,
): PromiseResult<TOk, TError> {
  if (pipeline.length === 0) {
    return notOk.Generic('Cannot execute an empty pipeline') as Result<TOk, TError>;
  }
  return await executeOperationMiddleware(context, pipeline, 0, operation);
}

async function executeOperationMiddleware<
  TContext extends ClientContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TMiddleware extends Middleware<TContext, any>,
  TName,
  TArgs,
  TOk,
  TError extends typeof ErrorType.Generic,
  TOp extends Operation<TName, TArgs, TOk, TError>,
>(
  context: TContext,
  pipeline: TMiddleware[],
  pipelineIndex: number,
  operation: OperationWithoutCallbacks<TOp>,
): PromiseResult<TOk, TError> {
  // Setup callbacks
  let result: Result<TOk, TError> | undefined;
  const resolve = (res: Result<TOk, TError>) => (result = res);

  const next = async () => {
    if (pipelineIndex >= pipeline.length - 1) {
      return notOk.Generic('The last middleware in the pipeline cannot call next()');
    }
    const nextResult = await executeOperationMiddleware(
      context,
      pipeline,
      pipelineIndex + 1,
      operation,
    );
    return nextResult;
  };

  const operationWithCallbacks = { ...operation, resolve, next } as unknown as TOp;

  // Execute the middleware in pipelineIndex
  try {
    await pipeline[pipelineIndex](context, operationWithCallbacks);
    assertIsDefined(result);

    return result;
  } catch (error) {
    return notOk.GenericUnexpectedException(context, error) as Result<TOk, TError>;
  }
}

export async function LoggingClientMiddleware<
  TContext extends ClientContext,
  TOk,
  TError extends typeof ErrorType.Generic,
  TOp extends Operation<unknown, unknown, TOk, TError>,
>(context: TContext, operation: TOp): Promise<void> {
  const { logger } = context;
  const noArgs = Array.isArray(operation.args) && operation.args.length === 0;
  if (noArgs) {
    logger.info('Executing %s', operation.name);
  } else {
    logger.info('Executing %s: %O', operation.name, operation.args);
  }

  const result = await operation.next();

  if (result.isError()) {
    logger.warn('Result %s error: %s: %s', operation.name, result.error, result.message);
  } else {
    // Add effect to log, effect is just a convention, not a formal part of OkResult
    const effect =
      typeof result.value === 'object' &&
      result.value &&
      (result.value as { effect?: unknown }).effect;
    if (typeof effect === 'string') {
      logger.info('Result %s ok, effect %s', operation.name, effect);
    } else {
      logger.info('Result %s ok', operation.name);
    }
  }
  operation.resolve(result);
}
