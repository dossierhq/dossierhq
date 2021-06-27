import { assertIsDefined } from './Asserts';

export interface Operation<TName, TArgs, TResult> {
  readonly name: TName;
  readonly args: TArgs;
  readonly resolve: (result: TResult) => void;
}

export interface Middleware<TContext, TOp> {
  (context: TContext, operation: TOp): Promise<void>;
}

export async function executeOperationPipeline<
  TContext,
  TResult,
  TOp extends Operation<unknown, unknown, TResult>
>(
  context: TContext,
  pipeline: Middleware<TContext, TOp>[],
  operation: Omit<TOp, 'resolve'>
): Promise<TResult> {
  let result: TResult | undefined;
  const resolve = (res: TResult) => (result = res);
  const operationWithResolve = { ...operation, resolve } as unknown as TOp;
  //TODO support pipeline
  await pipeline[0](context, operationWithResolve);
  assertIsDefined(result);
  return result;
}
