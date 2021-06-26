import type {
  AdminEntity,
  AdminEntityCreate,
  AdminQuery,
  Connection,
  Edge,
  EntityReference,
  EntityVersionReference,
  ErrorType,
  Paging,
  PromiseResult,
  Result,
} from '..';
import { assertIsDefined } from '..';

export interface AdminClient {
  getEntity(
    reference: EntityReference | EntityVersionReference
  ): PromiseResult<AdminEntity, ErrorType.NotFound>;

  getEntities(references: EntityReference[]): Promise<Result<AdminEntity, ErrorType.NotFound>[]>;

  searchEntities(
    query?: AdminQuery,
    paging?: Paging
  ): PromiseResult<Connection<Edge<AdminEntity, ErrorType>> | null, ErrorType.BadRequest>;

  getTotalCount(query?: AdminQuery): PromiseResult<number, ErrorType.BadRequest>;

  createEntity(entity: AdminEntityCreate): PromiseResult<AdminEntity, ErrorType.BadRequest>;
}

export enum AdminClientOperationName {
  CreateEntity = 'create-entity',
  GetEntities = 'get-entities',
  GetEntity = 'get-entity',
  GetTotalCount = 'get-total-count',
  SearchEntities = 'search-entities',
}

type MethodParameters<T extends keyof AdminClient> = Parameters<AdminClient[T]>;
type MethodReturnType<T extends keyof AdminClient> = WithoutPromise<ReturnType<AdminClient[T]>>;
type WithoutPromise<T> = T extends Promise<infer U> ? U : T;

interface AdminClientOperationArguments {
  [AdminClientOperationName.CreateEntity]: MethodParameters<'createEntity'>;
  [AdminClientOperationName.GetEntities]: MethodParameters<'getEntities'>;
  [AdminClientOperationName.GetEntity]: MethodParameters<'getEntity'>;
  [AdminClientOperationName.GetTotalCount]: MethodParameters<'getTotalCount'>;
  [AdminClientOperationName.SearchEntities]: MethodParameters<'searchEntities'>;
}

interface AdminClientOperationReturn {
  [AdminClientOperationName.CreateEntity]: MethodReturnType<'createEntity'>;
  [AdminClientOperationName.GetEntities]: MethodReturnType<'getEntities'>;
  [AdminClientOperationName.GetEntity]: MethodReturnType<'getEntity'>;
  [AdminClientOperationName.GetTotalCount]: MethodReturnType<'getTotalCount'>;
  [AdminClientOperationName.SearchEntities]: MethodReturnType<'searchEntities'>;
}

export interface AdminClientOperation<TName extends AdminClientOperationName> {
  readonly name: TName;
  readonly args: AdminClientOperationArguments[TName];
  readonly resolve: (result: AdminClientOperationReturn[TName]) => void;
}

export interface AdminClientMiddleware<TContext> {
  (context: TContext, operation: AdminClientOperation<AdminClientOperationName>): Promise<void>;
}

class BaseAdminClient<TContext> implements AdminClient {
  private readonly resolveContext: () => Promise<TContext>;
  private readonly pipeline: AdminClientMiddleware<TContext>[];

  constructor({
    resolveContext,
    pipeline,
  }: {
    resolveContext: () => Promise<TContext>;
    pipeline: AdminClientMiddleware<TContext>[];
  }) {
    this.resolveContext = resolveContext;
    this.pipeline = pipeline;
  }

  getEntity(
    reference: EntityReference | EntityVersionReference
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.GetEntity]> {
    return this.executeOperation({
      name: AdminClientOperationName.GetEntity,
      args: [reference],
    });
  }

  getEntities(
    references: EntityReference[]
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.GetEntities]> {
    return this.executeOperation({
      name: AdminClientOperationName.GetEntities,
      args: [references],
    });
  }

  searchEntities(
    query?: AdminQuery,
    paging?: Paging
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.SearchEntities]> {
    return this.executeOperation({
      name: AdminClientOperationName.SearchEntities,
      args: [query, paging],
    });
  }

  getTotalCount(
    query?: AdminQuery
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.GetTotalCount]> {
    return this.executeOperation({
      name: AdminClientOperationName.GetTotalCount,
      args: [query],
    });
  }

  createEntity(
    entity: AdminEntityCreate
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.CreateEntity]> {
    return this.executeOperation({
      name: AdminClientOperationName.CreateEntity,
      args: [entity],
    });
  }

  private async executeOperation<TName extends AdminClientOperationName>(
    operation: Omit<AdminClientOperation<TName>, 'resolve'>
  ): Promise<AdminClientOperationReturn[TName]> {
    const context = await this.resolveContext();
    let result: AdminClientOperationReturn[TName] | undefined;
    const resolve = (res: AdminClientOperationReturn[TName]) => (result = res);
    const operationWithResolve: AdminClientOperation<TName> = { ...operation, resolve };
    //TODO support pipeline
    await this.pipeline[0](
      context,
      operationWithResolve as unknown as AdminClientOperation<AdminClientOperationName>
    );
    assertIsDefined(result);
    return result;
  }
}

export function createBaseAdminClient<TContext>(option: {
  resolveContext: () => Promise<TContext>;
  pipeline: AdminClientMiddleware<TContext>[];
}): AdminClient {
  return new BaseAdminClient(option);
}
