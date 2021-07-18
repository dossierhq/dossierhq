import type { Entity, EntityReference, ErrorType, PromiseResult, Result } from '.';
import type { Middleware, Operation, OperationWithoutCallbacks } from './SharedClient';
import { executeOperationPipeline } from './SharedClient';

export interface PublishedClient {
  getEntity(reference: EntityReference): PromiseResult<Entity, ErrorType.NotFound>;

  getEntities(references: EntityReference[]): Promise<Result<Entity, ErrorType.NotFound>[]>;
}

export enum PublishedClientOperationName {
  getEntities = 'getEntities',
  getEntity = 'getEntity',
}

type MethodParameters<T extends keyof PublishedClient> = Parameters<PublishedClient[T]>;
type MethodReturnType<T extends keyof PublishedClient> = WithoutPromise<
  ReturnType<PublishedClient[T]>
>;
type WithoutPromise<T> = T extends Promise<infer U> ? U : T;

interface PublishedClientOperationArguments {
  [PublishedClientOperationName.getEntities]: MethodParameters<'getEntities'>;
  [PublishedClientOperationName.getEntity]: MethodParameters<'getEntity'>;
}

interface PublishedClientOperationReturn {
  [PublishedClientOperationName.getEntities]: MethodReturnType<'getEntities'>;
  [PublishedClientOperationName.getEntity]: MethodReturnType<'getEntity'>;
}

export type PublishedClientOperation<TName extends PublishedClientOperationName> = Operation<
  TName,
  PublishedClientOperationArguments[TName],
  PublishedClientOperationReturn[TName]
>;

export type PublishedClientMiddleware<TContext> = Middleware<
  TContext,
  PublishedClientOperation<PublishedClientOperationName>
>;

class BasePublishedClient<TContext> implements PublishedClient {
  private readonly resolveContext: () => Promise<TContext>;
  private readonly pipeline: PublishedClientMiddleware<TContext>[];

  constructor({
    resolveContext,
    pipeline,
  }: {
    resolveContext: () => Promise<TContext>;
    pipeline: PublishedClientMiddleware<TContext>[];
  }) {
    this.resolveContext = resolveContext;
    this.pipeline = pipeline;
  }

  getEntity(
    reference: EntityReference
  ): Promise<PublishedClientOperationReturn[PublishedClientOperationName.getEntity]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getEntity,
      args: [reference],
    });
  }

  getEntities(
    references: EntityReference[]
  ): Promise<PublishedClientOperationReturn[PublishedClientOperationName.getEntities]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getEntities,
      args: [references],
    });
  }

  private async executeOperation<TName extends PublishedClientOperationName>(
    operation: OperationWithoutCallbacks<PublishedClientOperation<TName>>
  ): Promise<PublishedClientOperationReturn[TName]> {
    const context = await this.resolveContext();

    return await executeOperationPipeline(context, this.pipeline, operation);
  }
}

export function createBasePublishedClient<TContext>(option: {
  resolveContext: () => Promise<TContext>;
  pipeline: PublishedClientMiddleware<TContext>[];
}): PublishedClient {
  return new BasePublishedClient(option);
}
