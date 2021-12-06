import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityCreatePayload,
  AdminEntityUpdate,
  AdminEntityUpdatePayload,
  AdminEntityUpsert,
  AdminEntityUpsertPayload,
  AdminQuery,
  AdminSchemaSpecification,
  AdminSchemaSpecificationUpdate,
  Connection,
  Edge,
  EntityHistory,
  EntityPublishPayload,
  EntityReference,
  EntityReferenceWithAuthKeys,
  EntityVersionReference,
  EntityVersionReferenceWithAuthKeys,
  JsonResult,
  Paging,
  PromiseResult,
  PublishingHistory,
  Result,
  SchemaSpecificationUpdatePayload,
} from '.';
import { assertExhaustive, convertJsonResult, ErrorType, notOk, ok } from '.';
import type { ErrorFromPromiseResult, OkFromPromiseResult } from './ErrorResult';
import type {
  JsonAdminEntity,
  JsonAdminEntityCreatePayload,
  JsonAdminEntityUpdatePayload,
  JsonAdminEntityUpsertPayload,
  JsonConnection,
  JsonEdge,
  JsonEntityHistory,
  JsonPublishingHistory,
  JsonPublishingResult,
} from './JsonUtils';
import {
  convertJsonAdminEntity,
  convertJsonConnection,
  convertJsonEdge,
  convertJsonEntityHistory,
  convertJsonPublishingHistory,
  convertJsonPublishingResult,
} from './JsonUtils';
import type {
  ClientContext,
  ContextProvider,
  Middleware,
  Operation,
  OperationWithoutCallbacks,
} from './SharedClient';
import { executeOperationPipeline } from './SharedClient';

export interface AdminClient {
  getSchemaSpecification(): PromiseResult<AdminSchemaSpecification, ErrorType.Generic>;

  updateSchemaSpecification(
    schemaSpec: AdminSchemaSpecificationUpdate
  ): PromiseResult<SchemaSpecificationUpdatePayload, ErrorType.BadRequest | ErrorType.Generic>;

  getEntity(
    reference: EntityReferenceWithAuthKeys | EntityVersionReferenceWithAuthKeys
  ): PromiseResult<
    AdminEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  getEntities(
    references: EntityReferenceWithAuthKeys[]
  ): PromiseResult<
    Result<
      AdminEntity,
      ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
    >[],
    ErrorType.Generic
  >;

  searchEntities(
    query?: AdminQuery,
    paging?: Paging
  ): PromiseResult<
    Connection<Edge<AdminEntity, ErrorType>> | null,
    ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  getTotalCount(
    query?: AdminQuery
  ): PromiseResult<number, ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic>;

  createEntity(
    entity: AdminEntityCreate
  ): PromiseResult<
    AdminEntityCreatePayload,
    ErrorType.BadRequest | ErrorType.Conflict | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  updateEntity(
    entity: AdminEntityUpdate
  ): PromiseResult<
    AdminEntityUpdatePayload,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  upsertEntity(
    entity: AdminEntityUpsert
  ): PromiseResult<
    AdminEntityUpsertPayload,
    ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  getEntityHistory(
    reference: EntityReferenceWithAuthKeys
  ): PromiseResult<
    EntityHistory,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  publishEntities(
    references: EntityVersionReferenceWithAuthKeys[]
  ): PromiseResult<
    EntityPublishPayload[],
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  unpublishEntities(
    references: EntityReferenceWithAuthKeys[]
  ): PromiseResult<
    EntityPublishPayload[],
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  archiveEntity(
    reference: EntityReferenceWithAuthKeys
  ): PromiseResult<
    EntityPublishPayload,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  unarchiveEntity(
    reference: EntityReferenceWithAuthKeys
  ): PromiseResult<
    EntityPublishPayload,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  getPublishingHistory(
    reference: EntityReferenceWithAuthKeys
  ): PromiseResult<
    PublishingHistory,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >;
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
type MethodReturnType<T extends keyof AdminClient> = PromiseResult<
  MethodReturnTypeOk<T>,
  MethodReturnTypeError<T>
>;
type MethodReturnTypeWithoutPromise<T extends keyof AdminClient> = WithoutPromise<
  PromiseResult<MethodReturnTypeOk<T>, MethodReturnTypeError<T>>
>;
type MethodReturnTypeOk<T extends keyof AdminClient> = OkFromPromiseResult<
  ReturnType<AdminClient[T]>
>;
type MethodReturnTypeError<T extends keyof AdminClient> = ErrorFromPromiseResult<
  ReturnType<AdminClient[T]>
>;
//TODO replace with Awaited when deno supports TS 4.5
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

interface AdminClientOperationReturnOk {
  [AdminClientOperationName.archiveEntity]: MethodReturnTypeOk<'archiveEntity'>;
  [AdminClientOperationName.createEntity]: MethodReturnTypeOk<'createEntity'>;
  [AdminClientOperationName.getEntities]: MethodReturnTypeOk<'getEntities'>;
  [AdminClientOperationName.getEntity]: MethodReturnTypeOk<'getEntity'>;
  [AdminClientOperationName.getEntityHistory]: MethodReturnTypeOk<'getEntityHistory'>;
  [AdminClientOperationName.getPublishingHistory]: MethodReturnTypeOk<'getPublishingHistory'>;
  [AdminClientOperationName.getSchemaSpecification]: MethodReturnTypeOk<'getSchemaSpecification'>;
  [AdminClientOperationName.getTotalCount]: MethodReturnTypeOk<'getTotalCount'>;
  [AdminClientOperationName.publishEntities]: MethodReturnTypeOk<'publishEntities'>;
  [AdminClientOperationName.searchEntities]: MethodReturnTypeOk<'searchEntities'>;
  [AdminClientOperationName.unarchiveEntity]: MethodReturnTypeOk<'unarchiveEntity'>;
  [AdminClientOperationName.unpublishEntities]: MethodReturnTypeOk<'unpublishEntities'>;
  [AdminClientOperationName.updateEntity]: MethodReturnTypeOk<'updateEntity'>;
  [AdminClientOperationName.updateSchemaSpecification]: MethodReturnTypeOk<'updateSchemaSpecification'>;
  [AdminClientOperationName.upsertEntity]: MethodReturnTypeOk<'upsertEntity'>;
}

interface AdminClientOperationReturnError {
  [AdminClientOperationName.archiveEntity]: MethodReturnTypeError<'archiveEntity'>;
  [AdminClientOperationName.createEntity]: MethodReturnTypeError<'createEntity'>;
  [AdminClientOperationName.getEntities]: MethodReturnTypeError<'getEntities'>;
  [AdminClientOperationName.getEntity]: MethodReturnTypeError<'getEntity'>;
  [AdminClientOperationName.getEntityHistory]: MethodReturnTypeError<'getEntityHistory'>;
  [AdminClientOperationName.getPublishingHistory]: MethodReturnTypeError<'getPublishingHistory'>;
  [AdminClientOperationName.getSchemaSpecification]: MethodReturnTypeError<'getSchemaSpecification'>;
  [AdminClientOperationName.getTotalCount]: MethodReturnTypeError<'getTotalCount'>;
  [AdminClientOperationName.publishEntities]: MethodReturnTypeError<'publishEntities'>;
  [AdminClientOperationName.searchEntities]: MethodReturnTypeError<'searchEntities'>;
  [AdminClientOperationName.unarchiveEntity]: MethodReturnTypeError<'unarchiveEntity'>;
  [AdminClientOperationName.unpublishEntities]: MethodReturnTypeError<'unpublishEntities'>;
  [AdminClientOperationName.updateEntity]: MethodReturnTypeError<'updateEntity'>;
  [AdminClientOperationName.updateSchemaSpecification]: MethodReturnTypeError<'updateSchemaSpecification'>;
  [AdminClientOperationName.upsertEntity]: MethodReturnTypeError<'upsertEntity'>;
}

export type AdminClientOperation<
  TName extends AdminClientOperationName = AdminClientOperationName
> = Operation<
  TName,
  AdminClientOperationArguments[TName],
  AdminClientOperationReturnOk[TName],
  AdminClientOperationReturnError[TName]
>;

export type AdminClientMiddleware<TContext extends ClientContext> = Middleware<
  TContext,
  AdminClientOperation
>;

export type AdminClientJsonOperation<
  TName extends AdminClientOperationName = AdminClientOperationName
> = AdminClientOperationArguments[TName];

class BaseAdminClient<TContext extends ClientContext> implements AdminClient {
  private readonly context: TContext | ContextProvider<TContext>;
  private readonly pipeline: AdminClientMiddleware<TContext>[];

  constructor({
    context,
    pipeline,
  }: {
    context: TContext | ContextProvider<TContext>;
    pipeline: AdminClientMiddleware<TContext>[];
  }) {
    this.context = context;
    this.pipeline = pipeline;
  }

  getSchemaSpecification(): PromiseResult<AdminSchemaSpecification, ErrorType.Generic> {
    return this.executeOperation({
      name: AdminClientOperationName.getSchemaSpecification,
      args: [],
      modifies: false,
    });
  }

  updateSchemaSpecification(
    schemaSpec: AdminSchemaSpecificationUpdate
  ): PromiseResult<SchemaSpecificationUpdatePayload, ErrorType.BadRequest | ErrorType.Generic> {
    return this.executeOperation({
      name: AdminClientOperationName.updateSchemaSpecification,
      args: [schemaSpec],
      modifies: true,
    });
  }

  getEntity(
    reference: EntityReference | EntityVersionReference
  ): MethodReturnType<AdminClientOperationName.getEntity> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntity,
      args: [reference],
      modifies: false,
    });
  }

  getEntities(
    references: EntityReference[]
  ): MethodReturnType<AdminClientOperationName.getEntities> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntities,
      args: [references],
      modifies: false,
    });
  }

  searchEntities(
    query?: AdminQuery,
    paging?: Paging
  ): MethodReturnType<AdminClientOperationName.searchEntities> {
    return this.executeOperation({
      name: AdminClientOperationName.searchEntities,
      args: [query, paging],
      modifies: false,
    });
  }

  getTotalCount(query?: AdminQuery): MethodReturnType<AdminClientOperationName.getTotalCount> {
    return this.executeOperation({
      name: AdminClientOperationName.getTotalCount,
      args: [query],
      modifies: false,
    });
  }

  createEntity(entity: AdminEntityCreate): MethodReturnType<AdminClientOperationName.createEntity> {
    return this.executeOperation({
      name: AdminClientOperationName.createEntity,
      args: [entity],
      modifies: true,
    });
  }

  updateEntity(entity: AdminEntityUpdate): MethodReturnType<AdminClientOperationName.updateEntity> {
    return this.executeOperation({
      name: AdminClientOperationName.updateEntity,
      args: [entity],
      modifies: true,
    });
  }

  upsertEntity(entity: AdminEntityUpsert): MethodReturnType<AdminClientOperationName.upsertEntity> {
    return this.executeOperation({
      name: AdminClientOperationName.upsertEntity,
      args: [entity],
      modifies: true,
    });
  }

  getEntityHistory(
    reference: EntityReference
  ): MethodReturnType<AdminClientOperationName.getEntityHistory> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntityHistory,
      args: [reference],
      modifies: false,
    });
  }

  publishEntities(
    references: EntityVersionReference[]
  ): MethodReturnType<AdminClientOperationName.publishEntities> {
    return this.executeOperation({
      name: AdminClientOperationName.publishEntities,
      args: [references],
      modifies: true,
    });
  }

  unpublishEntities(
    references: EntityReference[]
  ): MethodReturnType<AdminClientOperationName.unpublishEntities> {
    return this.executeOperation({
      name: AdminClientOperationName.unpublishEntities,
      args: [references],
      modifies: true,
    });
  }

  archiveEntity(
    reference: EntityReference
  ): MethodReturnType<AdminClientOperationName.archiveEntity> {
    return this.executeOperation({
      name: AdminClientOperationName.archiveEntity,
      args: [reference],
      modifies: true,
    });
  }

  unarchiveEntity(
    reference: EntityReference
  ): MethodReturnType<AdminClientOperationName.unarchiveEntity> {
    return this.executeOperation({
      name: AdminClientOperationName.unarchiveEntity,
      args: [reference],
      modifies: true,
    });
  }

  getPublishingHistory(
    reference: EntityReference
  ): MethodReturnType<AdminClientOperationName.getPublishingHistory> {
    return this.executeOperation({
      name: AdminClientOperationName.getPublishingHistory,
      args: [reference],
      modifies: false,
    });
  }

  private async executeOperation<TName extends AdminClientOperationName>(
    operation: OperationWithoutCallbacks<AdminClientOperation<TName>>
  ): PromiseResult<AdminClientOperationReturnOk[TName], AdminClientOperationReturnError[TName]> {
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

export function createBaseAdminClient<TContext extends ClientContext>(option: {
  context: TContext | ContextProvider<TContext>;
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
      return await adminClient.getEntities(references);
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
): MethodReturnTypeWithoutPromise<TName> {
  if (jsonResult.isError()) {
    //TODO check expected types
    return jsonResult as MethodReturnTypeWithoutPromise<TName>;
  }
  const { value } = jsonResult;
  switch (operationName) {
    case AdminClientOperationName.archiveEntity: {
      const result: MethodReturnTypeWithoutPromise<AdminClientOperationName.archiveEntity> = ok(
        convertJsonPublishingResult(value as JsonPublishingResult)
      );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case AdminClientOperationName.createEntity: {
      const valueTyped = value as JsonAdminEntityCreatePayload;
      const result: MethodReturnTypeWithoutPromise<AdminClientOperationName.createEntity> = ok({
        ...valueTyped,
        entity: convertJsonAdminEntity(valueTyped.entity),
      });
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case AdminClientOperationName.getEntities: {
      const result: MethodReturnTypeWithoutPromise<AdminClientOperationName.getEntities> = ok(
        (value as JsonResult<JsonAdminEntity, ErrorType.NotFound>[]).map((jsonItemResult) => {
          const itemResult = convertJsonResult(jsonItemResult);
          return itemResult.isOk() ? itemResult.map(convertJsonAdminEntity) : itemResult;
        })
      );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case AdminClientOperationName.getEntity: {
      const result: MethodReturnTypeWithoutPromise<AdminClientOperationName.getEntity> = ok(
        convertJsonAdminEntity(value as JsonAdminEntity)
      );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case AdminClientOperationName.getEntityHistory: {
      const result: MethodReturnTypeWithoutPromise<AdminClientOperationName.getEntityHistory> = ok(
        convertJsonEntityHistory(value as JsonEntityHistory)
      );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case AdminClientOperationName.getPublishingHistory: {
      const result: MethodReturnTypeWithoutPromise<AdminClientOperationName.getPublishingHistory> =
        ok(convertJsonPublishingHistory(value as JsonPublishingHistory));
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case AdminClientOperationName.getSchemaSpecification:
      return ok(value) as MethodReturnTypeWithoutPromise<TName>;
    case AdminClientOperationName.publishEntities: {
      const result: MethodReturnTypeWithoutPromise<AdminClientOperationName.publishEntities> = ok(
        (value as JsonPublishingResult[]).map(convertJsonPublishingResult)
      );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case AdminClientOperationName.getTotalCount:
      return ok(value) as MethodReturnTypeWithoutPromise<TName>;
    case AdminClientOperationName.searchEntities: {
      const result: MethodReturnTypeWithoutPromise<AdminClientOperationName.searchEntities> = ok(
        convertJsonConnection(
          value as JsonConnection<JsonEdge<JsonAdminEntity, ErrorType>> | null,
          convertJsonAdminEntityEdge
        )
      );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case AdminClientOperationName.unarchiveEntity: {
      const result: MethodReturnTypeWithoutPromise<AdminClientOperationName.unarchiveEntity> = ok(
        convertJsonPublishingResult(value as JsonPublishingResult)
      );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case AdminClientOperationName.unpublishEntities: {
      const result: MethodReturnTypeWithoutPromise<AdminClientOperationName.unpublishEntities> = ok(
        (value as JsonPublishingResult[]).map(convertJsonPublishingResult)
      );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case AdminClientOperationName.updateEntity: {
      const valueTyped = value as JsonAdminEntityUpdatePayload;
      const result: MethodReturnTypeWithoutPromise<AdminClientOperationName.updateEntity> = ok({
        ...valueTyped,
        entity: convertJsonAdminEntity(valueTyped.entity),
      });
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case AdminClientOperationName.updateSchemaSpecification:
      return ok(value) as MethodReturnTypeWithoutPromise<TName>;
    case AdminClientOperationName.upsertEntity: {
      const valueTyped = value as JsonAdminEntityUpsertPayload;
      const result: MethodReturnTypeWithoutPromise<AdminClientOperationName.upsertEntity> = ok({
        ...valueTyped,
        entity: convertJsonAdminEntity(valueTyped.entity),
      });
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    default:
      assertExhaustive(operationName);
  }
}

function convertJsonAdminEntityEdge(edge: JsonEdge<JsonAdminEntity, ErrorType>) {
  return convertJsonEdge(edge, convertJsonAdminEntity);
}
