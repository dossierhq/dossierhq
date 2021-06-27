import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  AdminQuery,
  Connection,
  Edge,
  EntityHistory,
  EntityReference,
  EntityVersionReference,
  ErrorType,
  Paging,
  PromiseResult,
  PublishingHistory,
  PublishingResult,
  Result,
} from '.';
import type { Middleware, Operation } from './SharedClient';
import { executeOperationPipeline } from './SharedClient';

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

  getEntityHistory(reference: EntityReference): PromiseResult<EntityHistory, ErrorType.NotFound>;

  publishEntities(
    references: EntityVersionReference[]
  ): PromiseResult<PublishingResult[], ErrorType.BadRequest | ErrorType.NotFound>;

  unpublishEntities(
    references: EntityReference[]
  ): PromiseResult<PublishingResult[], ErrorType.BadRequest | ErrorType.NotFound>;

  archiveEntity(
    reference: EntityReference
  ): PromiseResult<PublishingResult, ErrorType.BadRequest | ErrorType.NotFound>;

  unarchiveEntity(
    reference: EntityReference
  ): PromiseResult<PublishingResult, ErrorType.BadRequest | ErrorType.NotFound>;

  getPublishingHistory(
    reference: EntityReference
  ): PromiseResult<PublishingHistory, ErrorType.NotFound>;
}

export enum AdminClientOperationName {
  archiveEntity = 'archiveEntity',
  createEntity = 'createEntity',
  getEntities = 'getEntities',
  getEntity = 'getEntity',
  getEntityHistory = 'getEntityHistory',
  getPublishingHistory = 'getPublishingHistory',
  getTotalCount = 'getTotalCount',
  publishEntities = 'publishEntities',
  searchEntities = 'searchEntities',
  unarchiveEntity = 'unarchiveEntity',
  unpublishEntities = 'unpublishEntities',
  updateEntity = 'updateEntity',
}

type MethodParameters<T extends keyof AdminClient> = Parameters<AdminClient[T]>;
type MethodReturnType<T extends keyof AdminClient> = WithoutPromise<ReturnType<AdminClient[T]>>;
type WithoutPromise<T> = T extends Promise<infer U> ? U : T;

interface AdminClientOperationArguments {
  [AdminClientOperationName.archiveEntity]: MethodParameters<'archiveEntity'>;
  [AdminClientOperationName.createEntity]: MethodParameters<'createEntity'>;
  [AdminClientOperationName.getEntities]: MethodParameters<'getEntities'>;
  [AdminClientOperationName.getEntity]: MethodParameters<'getEntity'>;
  [AdminClientOperationName.getEntityHistory]: MethodParameters<'getEntityHistory'>;
  [AdminClientOperationName.getPublishingHistory]: MethodParameters<'getPublishingHistory'>;
  [AdminClientOperationName.getTotalCount]: MethodParameters<'getTotalCount'>;
  [AdminClientOperationName.publishEntities]: MethodParameters<'publishEntities'>;
  [AdminClientOperationName.searchEntities]: MethodParameters<'searchEntities'>;
  [AdminClientOperationName.unarchiveEntity]: MethodParameters<'unarchiveEntity'>;
  [AdminClientOperationName.unpublishEntities]: MethodParameters<'unpublishEntities'>;
  [AdminClientOperationName.updateEntity]: MethodParameters<'updateEntity'>;
}

interface AdminClientOperationReturn {
  [AdminClientOperationName.archiveEntity]: MethodReturnType<'archiveEntity'>;
  [AdminClientOperationName.createEntity]: MethodReturnType<'createEntity'>;
  [AdminClientOperationName.getEntities]: MethodReturnType<'getEntities'>;
  [AdminClientOperationName.getEntity]: MethodReturnType<'getEntity'>;
  [AdminClientOperationName.getEntityHistory]: MethodReturnType<'getEntityHistory'>;
  [AdminClientOperationName.getPublishingHistory]: MethodReturnType<'getPublishingHistory'>;
  [AdminClientOperationName.getTotalCount]: MethodReturnType<'getTotalCount'>;
  [AdminClientOperationName.publishEntities]: MethodReturnType<'publishEntities'>;
  [AdminClientOperationName.searchEntities]: MethodReturnType<'searchEntities'>;
  [AdminClientOperationName.unarchiveEntity]: MethodReturnType<'unarchiveEntity'>;
  [AdminClientOperationName.unpublishEntities]: MethodReturnType<'unpublishEntities'>;
  [AdminClientOperationName.updateEntity]: MethodReturnType<'updateEntity'>;
}

export type AdminClientOperation<TName extends AdminClientOperationName> = Operation<
  TName,
  AdminClientOperationArguments[TName],
  AdminClientOperationReturn[TName]
>;

export type AdminClientMiddleware<TContext> = Middleware<
  TContext,
  AdminClientOperation<AdminClientOperationName>
>;

// export interface AdminClientOperation<TName extends AdminClientOperationName> extends Operation<TName, {
//   readonly name: TName;
//   readonly args: AdminClientOperationArguments[TName];
//   readonly resolve: (result: AdminClientOperationReturn[TName]) => void;
// }

// export interface AdminClientMiddleware<TContext> {
//   (context: TContext, operation: AdminClientOperation<AdminClientOperationName>): Promise<void>;
// }

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

  getEntityHistory(
    reference: EntityReference
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.getEntityHistory]> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntityHistory,
      args: [reference],
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

  unpublishEntities(
    references: EntityReference[]
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.unpublishEntities]> {
    return this.executeOperation({
      name: AdminClientOperationName.unpublishEntities,
      args: [references],
    });
  }

  archiveEntity(
    reference: EntityReference
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.archiveEntity]> {
    return this.executeOperation({
      name: AdminClientOperationName.archiveEntity,
      args: [reference],
    });
  }

  unarchiveEntity(
    reference: EntityReference
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.unarchiveEntity]> {
    return this.executeOperation({
      name: AdminClientOperationName.unarchiveEntity,
      args: [reference],
    });
  }

  getPublishingHistory(
    reference: EntityReference
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.getPublishingHistory]> {
    return this.executeOperation({
      name: AdminClientOperationName.getPublishingHistory,
      args: [reference],
    });
  }

  private async executeOperation<TName extends AdminClientOperationName>(
    operation: Omit<AdminClientOperation<TName>, 'resolve'>
  ): Promise<AdminClientOperationReturn[TName]> {
    const context = await this.resolveContext();

    return await executeOperationPipeline(context, this.pipeline, operation);
  }
}

export function createBaseAdminClient<TContext>(option: {
  resolveContext: () => Promise<TContext>;
  pipeline: AdminClientMiddleware<TContext>[];
}): AdminClient {
  return new BaseAdminClient(option);
}
