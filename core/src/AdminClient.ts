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
import { assertExhaustive, ok } from '.';
import type {
  JsonConnection,
  JsonEdge,
  JsonEntityHistory,
  JsonPublishingHistory,
} from './JsonUtils';
import {
  convertJsonConnection,
  convertJsonEdge,
  convertJsonEntityHistory,
  convertJsonPublishingHistory,
} from './JsonUtils';
import type { Middleware, Operation, OperationWithoutCallbacks } from './SharedClient';
import { executeOperationPipeline } from './SharedClient';

export interface AdminClient {
  getEntity(
    reference: EntityReference | EntityVersionReference
  ): PromiseResult<AdminEntity, ErrorType.NotFound | ErrorType.Generic>;

  //TODO add top level result
  getEntities(
    references: EntityReference[]
  ): Promise<Result<AdminEntity, ErrorType.NotFound | ErrorType.Generic>[]>;

  searchEntities(
    query?: AdminQuery,
    paging?: Paging
  ): PromiseResult<
    Connection<Edge<AdminEntity, ErrorType>> | null,
    ErrorType.BadRequest | ErrorType.Generic
  >;

  getTotalCount(
    query?: AdminQuery
  ): PromiseResult<number, ErrorType.BadRequest | ErrorType.Generic>;

  createEntity(
    entity: AdminEntityCreate
  ): PromiseResult<AdminEntity, ErrorType.BadRequest | ErrorType.Generic>;

  updateEntity(
    entity: AdminEntityUpdate
  ): PromiseResult<AdminEntity, ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic>;

  getEntityHistory(
    reference: EntityReference
  ): PromiseResult<EntityHistory, ErrorType.NotFound | ErrorType.Generic>;

  publishEntities(
    references: EntityVersionReference[]
  ): PromiseResult<
    PublishingResult[],
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  >;

  unpublishEntities(
    references: EntityReference[]
  ): PromiseResult<
    PublishingResult[],
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  >;

  archiveEntity(
    reference: EntityReference
  ): PromiseResult<PublishingResult, ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic>;

  unarchiveEntity(
    reference: EntityReference
  ): PromiseResult<PublishingResult, ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic>;

  getPublishingHistory(
    reference: EntityReference
  ): PromiseResult<PublishingHistory, ErrorType.NotFound | ErrorType.Generic>;
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

export type AdminClientOperation<
  TName extends AdminClientOperationName = AdminClientOperationName
> = Operation<TName, AdminClientOperationArguments[TName], AdminClientOperationReturn[TName]>;

export type AdminClientMiddleware<TContext> = Middleware<TContext, AdminClientOperation>;

export interface AdminClientJsonOperation<
  TName extends AdminClientOperationName = AdminClientOperationName
> {
  args: AdminClientOperationArguments[TName];
}

class BaseAdminClient<TContext> implements AdminClient {
  private readonly context: TContext | (() => Promise<TContext>);
  private readonly pipeline: AdminClientMiddleware<TContext>[];

  constructor({
    context,
    pipeline,
  }: {
    context: TContext | (() => Promise<TContext>);
    pipeline: AdminClientMiddleware<TContext>[];
  }) {
    this.context = context;
    this.pipeline = pipeline;
  }

  getEntity(
    reference: EntityReference | EntityVersionReference
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.getEntity]> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntity,
      args: [reference],
      modifies: false,
    });
  }

  getEntities(
    references: EntityReference[]
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.getEntities]> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntities,
      args: [references],
      modifies: false,
    });
  }

  searchEntities(
    query?: AdminQuery,
    paging?: Paging
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.searchEntities]> {
    return this.executeOperation({
      name: AdminClientOperationName.searchEntities,
      args: [query, paging],
      modifies: false,
    });
  }

  getTotalCount(
    query?: AdminQuery
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.getTotalCount]> {
    return this.executeOperation({
      name: AdminClientOperationName.getTotalCount,
      args: [query],
      modifies: false,
    });
  }

  createEntity(
    entity: AdminEntityCreate
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.createEntity]> {
    return this.executeOperation({
      name: AdminClientOperationName.createEntity,
      args: [entity],
      modifies: true,
    });
  }

  updateEntity(
    entity: AdminEntityUpdate
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.updateEntity]> {
    return this.executeOperation({
      name: AdminClientOperationName.updateEntity,
      args: [entity],
      modifies: true,
    });
  }

  getEntityHistory(
    reference: EntityReference
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.getEntityHistory]> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntityHistory,
      args: [reference],
      modifies: false,
    });
  }

  publishEntities(
    references: EntityVersionReference[]
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.publishEntities]> {
    return this.executeOperation({
      name: AdminClientOperationName.publishEntities,
      args: [references],
      modifies: true,
    });
  }

  unpublishEntities(
    references: EntityReference[]
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.unpublishEntities]> {
    return this.executeOperation({
      name: AdminClientOperationName.unpublishEntities,
      args: [references],
      modifies: true,
    });
  }

  archiveEntity(
    reference: EntityReference
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.archiveEntity]> {
    return this.executeOperation({
      name: AdminClientOperationName.archiveEntity,
      args: [reference],
      modifies: true,
    });
  }

  unarchiveEntity(
    reference: EntityReference
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.unarchiveEntity]> {
    return this.executeOperation({
      name: AdminClientOperationName.unarchiveEntity,
      args: [reference],
      modifies: true,
    });
  }

  getPublishingHistory(
    reference: EntityReference
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.getPublishingHistory]> {
    return this.executeOperation({
      name: AdminClientOperationName.getPublishingHistory,
      args: [reference],
      modifies: false,
    });
  }

  private async executeOperation<TName extends AdminClientOperationName>(
    operation: OperationWithoutCallbacks<AdminClientOperation<TName>>
  ): Promise<AdminClientOperationReturn[TName]> {
    const context =
      typeof this.context === 'function'
        ? await (this.context as () => Promise<TContext>)()
        : this.context;

    return await executeOperationPipeline(context, this.pipeline, operation);
  }
}

export function createBaseAdminClient<TContext>(option: {
  context: TContext | (() => Promise<TContext>);
  pipeline: AdminClientMiddleware<TContext>[];
}): AdminClient {
  return new BaseAdminClient(option);
}

export function convertAdminClientOperationToJson(
  operation: AdminClientOperation
): AdminClientJsonOperation {
  const { args } = operation;
  switch (operation.name) {
    case AdminClientOperationName.archiveEntity:
    case AdminClientOperationName.createEntity:
    case AdminClientOperationName.getEntities:
    case AdminClientOperationName.getEntity:
    case AdminClientOperationName.getEntityHistory:
    case AdminClientOperationName.getPublishingHistory:
    case AdminClientOperationName.getTotalCount:
    case AdminClientOperationName.publishEntities:
    case AdminClientOperationName.searchEntities:
    case AdminClientOperationName.unarchiveEntity:
    case AdminClientOperationName.unpublishEntities:
    case AdminClientOperationName.updateEntity:
      //TODO cleanup args? e.g. reference, keep only id
      return { args };
    default:
      assertExhaustive(operation.name);
  }
}

export async function executeAdminClientOperationFromJson<TName extends AdminClientOperationName>(
  adminClient: AdminClient,
  operationName: TName,
  operation: AdminClientJsonOperation
): PromiseResult<unknown, ErrorType> {
  switch (operationName) {
    case AdminClientOperationName.archiveEntity: {
      const [reference] =
        operation.args as AdminClientOperationArguments[AdminClientOperationName.archiveEntity];
      return await adminClient.archiveEntity(reference);
    }
    case AdminClientOperationName.createEntity: {
      const [entity] =
        operation.args as AdminClientOperationArguments[AdminClientOperationName.createEntity];
      return await adminClient.createEntity(entity);
    }
    case AdminClientOperationName.getEntities: {
      const [references] =
        operation.args as AdminClientOperationArguments[AdminClientOperationName.getEntities];
      const result = await adminClient.getEntities(references);
      return ok(result);
    }
    case AdminClientOperationName.getEntity: {
      const [reference] =
        operation.args as AdminClientOperationArguments[AdminClientOperationName.getEntity];
      return await adminClient.getEntity(reference);
    }
    case AdminClientOperationName.getEntityHistory: {
      const [reference] =
        operation.args as AdminClientOperationArguments[AdminClientOperationName.getEntityHistory];
      return await adminClient.getEntityHistory(reference);
    }
    case AdminClientOperationName.getPublishingHistory: {
      const [reference] =
        operation.args as AdminClientOperationArguments[AdminClientOperationName.getPublishingHistory];
      return await adminClient.getPublishingHistory(reference);
    }
    case AdminClientOperationName.getTotalCount: {
      const [query] =
        operation.args as AdminClientOperationArguments[AdminClientOperationName.getTotalCount];
      return await adminClient.getTotalCount(query);
    }
    case AdminClientOperationName.publishEntities: {
      const [references] =
        operation.args as AdminClientOperationArguments[AdminClientOperationName.publishEntities];
      return await adminClient.publishEntities(references);
    }
    case AdminClientOperationName.searchEntities: {
      const [query, paging] =
        operation.args as AdminClientOperationArguments[AdminClientOperationName.searchEntities];
      return await adminClient.searchEntities(query, paging);
    }
    case AdminClientOperationName.unarchiveEntity: {
      const [reference] =
        operation.args as AdminClientOperationArguments[AdminClientOperationName.unarchiveEntity];
      return await adminClient.unarchiveEntity(reference);
    }
    case AdminClientOperationName.unpublishEntities: {
      const [references] =
        operation.args as AdminClientOperationArguments[AdminClientOperationName.unpublishEntities];
      return await adminClient.unpublishEntities(references);
    }
    case AdminClientOperationName.updateEntity: {
      const [entity] =
        operation.args as AdminClientOperationArguments[AdminClientOperationName.updateEntity];
      return await adminClient.updateEntity(entity);
    }
    default:
      assertExhaustive(operationName);
  }
}

export function convertJsonAdminClientResult<TName extends AdminClientOperationName>(
  operationName: TName,
  jsonResult: Result<unknown, ErrorType>
): AdminClientOperationReturn[TName] {
  if (jsonResult.isError()) {
    //TODO check expected types
    return jsonResult as AdminClientOperationReturn[TName];
  }
  const { value } = jsonResult;
  switch (operationName) {
    case AdminClientOperationName.archiveEntity:
    case AdminClientOperationName.createEntity:
    case AdminClientOperationName.getEntities:
    case AdminClientOperationName.getEntity:
    case AdminClientOperationName.getTotalCount:
    case AdminClientOperationName.publishEntities:
    case AdminClientOperationName.unarchiveEntity:
    case AdminClientOperationName.unpublishEntities:
    case AdminClientOperationName.updateEntity:
      return ok(value) as AdminClientOperationReturn[TName];
    case AdminClientOperationName.getEntityHistory: {
      const result: AdminClientOperationReturn[AdminClientOperationName.getEntityHistory] = ok(
        convertJsonEntityHistory(value as JsonEntityHistory)
      );
      return result as AdminClientOperationReturn[TName];
    }
    case AdminClientOperationName.getPublishingHistory: {
      const result: AdminClientOperationReturn[AdminClientOperationName.getPublishingHistory] = ok(
        convertJsonPublishingHistory(value as JsonPublishingHistory)
      );
      return result as AdminClientOperationReturn[TName];
    }
    case AdminClientOperationName.searchEntities: {
      const result: AdminClientOperationReturn[AdminClientOperationName.searchEntities] = ok(
        convertJsonConnection(
          value as JsonConnection<JsonEdge<AdminEntity, ErrorType>> | null,
          convertJsonEdge
        )
      );
      return result as AdminClientOperationReturn[TName];
    }
    default:
      assertExhaustive(operationName);
  }
}
