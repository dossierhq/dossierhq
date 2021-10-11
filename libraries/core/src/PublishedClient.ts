import type {
  Connection,
  ContextProvider,
  Edge,
  Entity,
  EntityReference,
  Paging,
  PromiseResult,
  Query,
  Result,
} from '.';
import { ErrorType, notOk } from '.';
import type { ErrorFromPromiseResult, OkFromPromiseResult } from './ErrorResult';
import type {
  ClientContext,
  Middleware,
  Operation,
  OperationWithoutCallbacks,
} from './SharedClient';
import { executeOperationPipeline } from './SharedClient';

export interface PublishedClient {
  getEntity(
    reference: EntityReference
  ): PromiseResult<Entity, ErrorType.NotFound | ErrorType.Generic>;

  getEntities(
    references: EntityReference[]
  ): PromiseResult<Result<Entity, ErrorType.NotFound>[], ErrorType.Generic>;

  searchEntities(
    query?: Query,
    paging?: Paging
  ): PromiseResult<
    Connection<Edge<Entity, ErrorType>> | null,
    ErrorType.BadRequest | ErrorType.Generic
  >;
}

export enum PublishedClientOperationName {
  getEntities = 'getEntities',
  getEntity = 'getEntity',
  searchEntities = 'searchEntities',
}

type MethodParameters<T extends keyof PublishedClient> = Parameters<PublishedClient[T]>;
type MethodReturnType<T extends keyof PublishedClient> = WithoutPromise<
  ReturnType<PublishedClient[T]>
>;
type MethodReturnTypeOk<T extends keyof PublishedClient> = OkFromPromiseResult<
  ReturnType<PublishedClient[T]>
>;
type MethodReturnTypeError<T extends keyof PublishedClient> = ErrorFromPromiseResult<
  ReturnType<PublishedClient[T]>
>;

type WithoutPromise<T> = T extends Promise<infer U> ? U : T;

interface PublishedClientOperationArguments {
  [PublishedClientOperationName.getEntities]: MethodParameters<'getEntities'>;
  [PublishedClientOperationName.getEntity]: MethodParameters<'getEntity'>;
  [PublishedClientOperationName.searchEntities]: MethodParameters<'searchEntities'>;
}

interface PublishedClientOperationReturn {
  [PublishedClientOperationName.getEntities]: MethodReturnType<'getEntities'>;
  [PublishedClientOperationName.getEntity]: MethodReturnType<'getEntity'>;
  [PublishedClientOperationName.searchEntities]: MethodReturnType<'searchEntities'>;
}

interface PublishedClientOperationReturnOk {
  [PublishedClientOperationName.getEntities]: MethodReturnTypeOk<'getEntities'>;
  [PublishedClientOperationName.getEntity]: MethodReturnTypeOk<'getEntity'>;
  [PublishedClientOperationName.searchEntities]: MethodReturnTypeOk<'searchEntities'>;
}

interface PublishedClientOperationReturnError {
  [PublishedClientOperationName.getEntities]: MethodReturnTypeError<'getEntities'>;
  [PublishedClientOperationName.getEntity]: MethodReturnTypeError<'getEntity'>;
  [PublishedClientOperationName.searchEntities]: MethodReturnTypeError<'searchEntities'>;
}

export type PublishedClientOperation<
  TName extends PublishedClientOperationName = PublishedClientOperationName
> = Operation<
  TName,
  PublishedClientOperationArguments[TName],
  PublishedClientOperationReturnOk[TName],
  PublishedClientOperationReturnError[TName]
>;

export type PublishedClientMiddleware<TContext extends ClientContext> = Middleware<
  TContext,
  PublishedClientOperation
>;

class BasePublishedClient<TContext extends ClientContext> implements PublishedClient {
  private readonly context: TContext | ContextProvider<TContext>;
  private readonly pipeline: PublishedClientMiddleware<TContext>[];

  constructor({
    context,
    pipeline,
  }: {
    context: TContext | ContextProvider<TContext>;
    pipeline: PublishedClientMiddleware<TContext>[];
  }) {
    this.context = context;
    this.pipeline = pipeline;
  }

  getEntity(
    reference: EntityReference
  ): Promise<PublishedClientOperationReturn[PublishedClientOperationName.getEntity]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getEntity,
      args: [reference],
      modifies: false,
    });
  }

  getEntities(
    references: EntityReference[]
  ): Promise<PublishedClientOperationReturn[PublishedClientOperationName.getEntities]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getEntities,
      args: [references],
      modifies: false,
    });
  }

  searchEntities(
    query?: Query,
    paging?: Paging
  ): Promise<PublishedClientOperationReturn[PublishedClientOperationName.searchEntities]> {
    return this.executeOperation({
      name: PublishedClientOperationName.searchEntities,
      args: [query, paging],
      modifies: false,
    });
  }

  private async executeOperation<TName extends PublishedClientOperationName>(
    operation: OperationWithoutCallbacks<PublishedClientOperation<TName>>
  ): PromiseResult<
    PublishedClientOperationReturnOk[TName],
    PublishedClientOperationReturnError[TName]
  > {
    let context: TContext;
    if (typeof this.context === 'function') {
      const contextResult = await (this.context as ContextProvider<TContext>)();
      if (contextResult.isError()) {
        if (contextResult.isErrorType(ErrorType.Generic)) {
          return contextResult;
        }
        //TODO maybe operation should have a list of supported error types?
        return notOk.GenericUnexpectedError(contextResult);
      }
      context = contextResult.value.context;
    } else {
      context = this.context;
    }

    return await executeOperationPipeline(context, this.pipeline, operation);
  }
}

export function createBasePublishedClient<TContext extends ClientContext>(option: {
  context: TContext | ContextProvider<TContext>;
  pipeline: PublishedClientMiddleware<TContext>[];
}): PublishedClient {
  return new BasePublishedClient(option);
}
