import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityCreatePayload,
  AdminEntityUpdate,
  AdminEntityUpdatePayload,
  AdminEntityUpsert,
  AdminEntityUpsertPayload,
  AdminQuery,
  Connection,
  Edge,
  EntityHistory,
  EntityPublishPayload,
  EntityReference,
  EntityVersionReference,
  ErrorType,
  Paging,
  PromiseResult,
  PublishingHistory,
  Result,
  SchemaSpecification,
  SchemaSpecificationUpdate,
  SchemaSpecificationUpdatePayload,
} from '.';
import { assertExhaustive, ok } from '.';
import type {
  JsonConnection,
  JsonEdge,
  JsonEntityHistory,
  JsonPublishingHistory,
  JsonPublishingResult,
} from './JsonUtils';
import {
  convertJsonConnection,
  convertJsonEdge,
  convertJsonEntityHistory,
  convertJsonPublishingHistory,
  convertJsonPublishingResult,
} from './JsonUtils';
import type { Middleware, Operation, OperationWithoutCallbacks } from './SharedClient';
import { executeOperationPipeline } from './SharedClient';

export interface AdminClient {
  getSchemaSpecification(): PromiseResult<SchemaSpecification, ErrorType.Generic>;
  updateSchemaSpecification(
    schemaSpec: SchemaSpecificationUpdate
  ): PromiseResult<SchemaSpecificationUpdatePayload, ErrorType.BadRequest | ErrorType.Generic>;

  getEntity(
    reference: EntityReference | EntityVersionReference
  ): PromiseResult<AdminEntity, ErrorType.NotFound | ErrorType.Generic>;

  getEntities(
    references: EntityReference[]
  ): PromiseResult<Result<AdminEntity, ErrorType.NotFound>[], ErrorType.Generic>;

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
  ): PromiseResult<
    AdminEntityCreatePayload,
    ErrorType.BadRequest | ErrorType.Conflict | ErrorType.Generic
  >;

  updateEntity(
    entity: AdminEntityUpdate
  ): PromiseResult<
    AdminEntityUpdatePayload,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  >;

  upsertEntity(
    entity: AdminEntityUpsert
  ): PromiseResult<AdminEntityUpsertPayload, ErrorType.BadRequest | ErrorType.Generic>;

  getEntityHistory(
    reference: EntityReference
  ): PromiseResult<EntityHistory, ErrorType.NotFound | ErrorType.Generic>;

  publishEntities(
    references: EntityVersionReference[]
  ): PromiseResult<
    EntityPublishPayload[],
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  >;

  unpublishEntities(
    references: EntityReference[]
  ): PromiseResult<
    EntityPublishPayload[],
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  >;

  archiveEntity(
    reference: EntityReference
  ): PromiseResult<
    EntityPublishPayload,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  >;

  unarchiveEntity(
    reference: EntityReference
  ): PromiseResult<
    EntityPublishPayload,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  >;

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
  getSchemaSpecification = 'getSchemaSpecification',
  getTotalCount = 'getTotalCount',
  publishEntities = 'publishEntities',
  searchEntities = 'searchEntities',
  unarchiveEntity = 'unarchiveEntity',
  unpublishEntities = 'unpublishEntities',
  updateEntity = 'updateEntity',
  updateSchemaSpecification = 'updateSchemaSpecification',
  upsertEntity = 'upsertEntity',
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
  [AdminClientOperationName.getSchemaSpecification]: MethodParameters<'getSchemaSpecification'>;
  [AdminClientOperationName.getTotalCount]: MethodParameters<'getTotalCount'>;
  [AdminClientOperationName.publishEntities]: MethodParameters<'publishEntities'>;
  [AdminClientOperationName.searchEntities]: MethodParameters<'searchEntities'>;
  [AdminClientOperationName.unarchiveEntity]: MethodParameters<'unarchiveEntity'>;
  [AdminClientOperationName.unpublishEntities]: MethodParameters<'unpublishEntities'>;
  [AdminClientOperationName.updateEntity]: MethodParameters<'updateEntity'>;
  [AdminClientOperationName.updateSchemaSpecification]: MethodParameters<'updateSchemaSpecification'>;
  [AdminClientOperationName.upsertEntity]: MethodParameters<'upsertEntity'>;
}

interface AdminClientOperationReturn {
  [AdminClientOperationName.archiveEntity]: MethodReturnType<'archiveEntity'>;
  [AdminClientOperationName.createEntity]: MethodReturnType<'createEntity'>;
  [AdminClientOperationName.getEntities]: MethodReturnType<'getEntities'>;
  [AdminClientOperationName.getEntity]: MethodReturnType<'getEntity'>;
  [AdminClientOperationName.getEntityHistory]: MethodReturnType<'getEntityHistory'>;
  [AdminClientOperationName.getPublishingHistory]: MethodReturnType<'getPublishingHistory'>;
  [AdminClientOperationName.getSchemaSpecification]: MethodReturnType<'getSchemaSpecification'>;
  [AdminClientOperationName.getTotalCount]: MethodReturnType<'getTotalCount'>;
  [AdminClientOperationName.publishEntities]: MethodReturnType<'publishEntities'>;
  [AdminClientOperationName.searchEntities]: MethodReturnType<'searchEntities'>;
  [AdminClientOperationName.unarchiveEntity]: MethodReturnType<'unarchiveEntity'>;
  [AdminClientOperationName.unpublishEntities]: MethodReturnType<'unpublishEntities'>;
  [AdminClientOperationName.updateEntity]: MethodReturnType<'updateEntity'>;
  [AdminClientOperationName.updateSchemaSpecification]: MethodReturnType<'updateSchemaSpecification'>;
  [AdminClientOperationName.upsertEntity]: MethodReturnType<'upsertEntity'>;
}

export type AdminClientOperation<
  TName extends AdminClientOperationName = AdminClientOperationName
> = Operation<TName, AdminClientOperationArguments[TName], AdminClientOperationReturn[TName]>;

export type AdminClientMiddleware<TContext> = Middleware<TContext, AdminClientOperation>;

export type AdminClientJsonOperation<
  TName extends AdminClientOperationName = AdminClientOperationName
> = AdminClientOperationArguments[TName];

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

  getSchemaSpecification(): PromiseResult<SchemaSpecification, ErrorType.Generic> {
    return this.executeOperation({
      name: AdminClientOperationName.getSchemaSpecification,
      args: [],
      modifies: false,
    });
  }

  updateSchemaSpecification(
    schemaSpec: SchemaSpecificationUpdate
  ): PromiseResult<SchemaSpecificationUpdatePayload, ErrorType.BadRequest | ErrorType.Generic> {
    return this.executeOperation({
      name: AdminClientOperationName.updateSchemaSpecification,
      args: [schemaSpec],
      modifies: true,
    });
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

  upsertEntity(
    entity: AdminEntityUpsert
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.upsertEntity]> {
    return this.executeOperation({
      name: AdminClientOperationName.upsertEntity,
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
    case AdminClientOperationName.getSchemaSpecification:
    case AdminClientOperationName.getTotalCount:
    case AdminClientOperationName.publishEntities:
    case AdminClientOperationName.searchEntities:
    case AdminClientOperationName.unarchiveEntity:
    case AdminClientOperationName.unpublishEntities:
    case AdminClientOperationName.updateEntity:
    case AdminClientOperationName.updateSchemaSpecification:
    case AdminClientOperationName.upsertEntity:
      //TODO cleanup args? e.g. reference, keep only id
      return args;
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
        operation as AdminClientOperationArguments[AdminClientOperationName.archiveEntity];
      return await adminClient.archiveEntity(reference);
    }
    case AdminClientOperationName.createEntity: {
      const [entity] =
        operation as AdminClientOperationArguments[AdminClientOperationName.createEntity];
      return await adminClient.createEntity(entity);
    }
    case AdminClientOperationName.getEntities: {
      const [references] =
        operation as AdminClientOperationArguments[AdminClientOperationName.getEntities];
      const result = await adminClient.getEntities(references);
      return ok(result);
    }
    case AdminClientOperationName.getEntity: {
      const [reference] =
        operation as AdminClientOperationArguments[AdminClientOperationName.getEntity];
      return await adminClient.getEntity(reference);
    }
    case AdminClientOperationName.getEntityHistory: {
      const [reference] =
        operation as AdminClientOperationArguments[AdminClientOperationName.getEntityHistory];
      return await adminClient.getEntityHistory(reference);
    }
    case AdminClientOperationName.getPublishingHistory: {
      const [reference] =
        operation as AdminClientOperationArguments[AdminClientOperationName.getPublishingHistory];
      return await adminClient.getPublishingHistory(reference);
    }
    case AdminClientOperationName.getSchemaSpecification: {
      return await adminClient.getSchemaSpecification();
    }
    case AdminClientOperationName.getTotalCount: {
      const [query] =
        operation as AdminClientOperationArguments[AdminClientOperationName.getTotalCount];
      return await adminClient.getTotalCount(query);
    }
    case AdminClientOperationName.publishEntities: {
      const [references] =
        operation as AdminClientOperationArguments[AdminClientOperationName.publishEntities];
      return await adminClient.publishEntities(references);
    }
    case AdminClientOperationName.searchEntities: {
      const [query, paging] =
        operation as AdminClientOperationArguments[AdminClientOperationName.searchEntities];
      return await adminClient.searchEntities(query, paging);
    }
    case AdminClientOperationName.unarchiveEntity: {
      const [reference] =
        operation as AdminClientOperationArguments[AdminClientOperationName.unarchiveEntity];
      return await adminClient.unarchiveEntity(reference);
    }
    case AdminClientOperationName.unpublishEntities: {
      const [references] =
        operation as AdminClientOperationArguments[AdminClientOperationName.unpublishEntities];
      return await adminClient.unpublishEntities(references);
    }
    case AdminClientOperationName.updateEntity: {
      const [entity] =
        operation as AdminClientOperationArguments[AdminClientOperationName.updateEntity];
      return await adminClient.updateEntity(entity);
    }
    case AdminClientOperationName.updateSchemaSpecification: {
      const [schemaSpec] =
        operation as AdminClientOperationArguments[AdminClientOperationName.updateSchemaSpecification];
      return await adminClient.updateSchemaSpecification(schemaSpec);
    }
    case AdminClientOperationName.upsertEntity: {
      const [entity] =
        operation as AdminClientOperationArguments[AdminClientOperationName.upsertEntity];
      return await adminClient.upsertEntity(entity);
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
    case AdminClientOperationName.createEntity:
    case AdminClientOperationName.getEntities:
    case AdminClientOperationName.getEntity:
    case AdminClientOperationName.getSchemaSpecification:
    case AdminClientOperationName.getTotalCount:
    case AdminClientOperationName.updateEntity:
    case AdminClientOperationName.updateSchemaSpecification:
    case AdminClientOperationName.upsertEntity:
      //TODO convert Temporal.Instant in entities
      return ok(value) as AdminClientOperationReturn[TName];
    case AdminClientOperationName.archiveEntity: {
      const result: AdminClientOperationReturn[AdminClientOperationName.archiveEntity] = ok(
        convertJsonPublishingResult(value as JsonPublishingResult)
      );
      return result as AdminClientOperationReturn[TName];
    }
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
    case AdminClientOperationName.publishEntities: {
      const result: AdminClientOperationReturn[AdminClientOperationName.publishEntities] = ok(
        (value as JsonPublishingResult[]).map(convertJsonPublishingResult)
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
    case AdminClientOperationName.unarchiveEntity: {
      const result: AdminClientOperationReturn[AdminClientOperationName.unarchiveEntity] = ok(
        convertJsonPublishingResult(value as JsonPublishingResult)
      );
      return result as AdminClientOperationReturn[TName];
    }
    case AdminClientOperationName.unpublishEntities: {
      const result: AdminClientOperationReturn[AdminClientOperationName.unpublishEntities] = ok(
        (value as JsonPublishingResult[]).map(convertJsonPublishingResult)
      );
      return result as AdminClientOperationReturn[TName];
    }
    default:
      assertExhaustive(operationName);
  }
}
