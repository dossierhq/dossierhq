import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  AdminQuery,
  Connection,
  Edge,
  EntityReference,
  EntityVersionReference,
  ErrorType,
  Paging,
  PromiseResult,
  PublishingResult,
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

  updateEntity(
    entity: AdminEntityUpdate
  ): PromiseResult<AdminEntity, ErrorType.BadRequest | ErrorType.NotFound>;

  publishEntities(
    references: EntityVersionReference[]
  ): PromiseResult<PublishingResult[], ErrorType.BadRequest | ErrorType.NotFound>;
}

export enum AdminClientOperationName {
  createEntity = 'createEntity',
  getEntities = 'getEntities',
  getEntity = 'getEntity',
  getTotalCount = 'getTotalCount',
  publishEntities = 'publishEntities',
  searchEntities = 'searchEntities',
  updateEntity = 'updateEntity',
}

type MethodParameters<T extends keyof AdminClient> = Parameters<AdminClient[T]>;
type MethodReturnType<T extends keyof AdminClient> = WithoutPromise<ReturnType<AdminClient[T]>>;
type WithoutPromise<T> = T extends Promise<infer U> ? U : T;

interface AdminClientOperationArguments {
  [AdminClientOperationName.createEntity]: MethodParameters<'createEntity'>;
  [AdminClientOperationName.getEntities]: MethodParameters<'getEntities'>;
  [AdminClientOperationName.getEntity]: MethodParameters<'getEntity'>;
  [AdminClientOperationName.getTotalCount]: MethodParameters<'getTotalCount'>;
  [AdminClientOperationName.publishEntities]: MethodParameters<'publishEntities'>;
  [AdminClientOperationName.searchEntities]: MethodParameters<'searchEntities'>;
  [AdminClientOperationName.updateEntity]: MethodParameters<'updateEntity'>;
}

interface AdminClientOperationReturn {
  [AdminClientOperationName.createEntity]: MethodReturnType<'createEntity'>;
  [AdminClientOperationName.getEntities]: MethodReturnType<'getEntities'>;
  [AdminClientOperationName.getEntity]: MethodReturnType<'getEntity'>;
  [AdminClientOperationName.getTotalCount]: MethodReturnType<'getTotalCount'>;
  [AdminClientOperationName.publishEntities]: MethodReturnType<'publishEntities'>;
  [AdminClientOperationName.searchEntities]: MethodReturnType<'searchEntities'>;
  [AdminClientOperationName.updateEntity]: MethodReturnType<'updateEntity'>;
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
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.getEntity]> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntity,
      args: [reference],
    });
  }

  getEntities(
    references: EntityReference[]
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.getEntities]> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntities,
      args: [references],
    });
  }

  searchEntities(
    query?: AdminQuery,
    paging?: Paging
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.searchEntities]> {
    return this.executeOperation({
      name: AdminClientOperationName.searchEntities,
      args: [query, paging],
    });
  }

  getTotalCount(
    query?: AdminQuery
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.getTotalCount]> {
    return this.executeOperation({
      name: AdminClientOperationName.getTotalCount,
      args: [query],
    });
  }

  createEntity(
    entity: AdminEntityCreate
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.createEntity]> {
    return this.executeOperation({
      name: AdminClientOperationName.createEntity,
      args: [entity],
    });
  }

  updateEntity(
    entity: AdminEntityUpdate
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.updateEntity]> {
    return this.executeOperation({
      name: AdminClientOperationName.updateEntity,
      args: [entity],
    });
  }

  publishEntities(
    references: EntityVersionReference[]
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.publishEntities]> {
    return this.executeOperation({
      name: AdminClientOperationName.publishEntities,
      args: [references],
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
