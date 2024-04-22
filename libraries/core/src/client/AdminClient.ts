import {
  ErrorType,
  notOk,
  ok,
  type ErrorFromResult,
  type OkFromResult,
  type PromiseResult,
  type Result,
} from '../ErrorResult.js';
import type {
  Entity,
  EntityArchivePayload,
  EntityCreate,
  EntityCreatePayload,
  EntityMutationOptions,
  EntityProcessDirtyPayload,
  EntityPublishPayload,
  EntityQuery,
  EntitySharedQuery,
  EntityUnarchivePayload,
  EntityUnpublishPayload,
  EntityUpdate,
  EntityUpdatePayload,
  EntityUpsert,
  EntityUpsertPayload,
  AdvisoryLockOptions,
  AdvisoryLockPayload,
  AdvisoryLockReleasePayload,
  Component,
  Connection,
  Edge,
  EntityReference,
  EntitySamplingOptions,
  EntitySamplingPayload,
  EntityVersionReference,
  Paging,
  UniqueIndexReference,
} from '../Types.js';
import type { ChangelogEvent, ChangelogEventQuery } from '../events/EventTypes.js';
import type {
  SchemaSpecification,
  SchemaSpecificationUpdate,
  SchemaSpecificationWithMigrations,
  SchemaSpecificationUpdatePayload,
} from '../schema/SchemaSpecification.js';
import type { LooseAutocomplete } from '../utils/TypeUtils.js';
import {
  convertJsonEntity,
  convertJsonChangelogEventEdge,
  convertJsonConnection,
  convertJsonEdge,
  convertJsonPublishingResult,
  convertJsonResult,
  type JsonEntity,
  type JsonEntityCreatePayload,
  type JsonEntityUpdatePayload,
  type JsonEntityUpsertPayload,
  type JsonChangelogEvent,
  type JsonConnection,
  type JsonEdge,
  type JsonPublishingResult,
  type JsonResult,
} from './JsonUtils.js';
import {
  executeOperationPipeline,
  type ClientContext,
  type ContextProvider,
  type Middleware,
  type Operation,
  type OperationWithoutCallbacks,
} from './SharedClient.js';

export interface AdminClient<
  TEntity extends Entity<string, object> = Entity,
  TComponent extends Component<string, object> = Component,
  TUniqueIndex extends string = string,
  TExceptionClient extends AdminExceptionClient<
    TEntity,
    TComponent,
    TUniqueIndex
  > = AdminExceptionClient<TEntity, TComponent, TUniqueIndex>,
> {
  getSchemaSpecification(options: {
    includeMigrations: true;
  }): PromiseResult<SchemaSpecificationWithMigrations, typeof ErrorType.Generic>;
  getSchemaSpecification(options?: {
    includeMigrations: boolean;
  }): PromiseResult<SchemaSpecification, typeof ErrorType.Generic>;

  updateSchemaSpecification(
    schemaSpec: SchemaSpecificationUpdate,
    options: { includeMigrations: true },
  ): PromiseResult<
    SchemaSpecificationUpdatePayload<SchemaSpecificationWithMigrations>,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;
  updateSchemaSpecification(
    schemaSpec: SchemaSpecificationUpdate,
    options?: { includeMigrations: boolean },
  ): PromiseResult<
    SchemaSpecificationUpdatePayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  getEntity(
    reference: EntityReference | EntityVersionReference | UniqueIndexReference<TUniqueIndex>,
  ): PromiseResult<
    TEntity,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  getEntityList(
    references: EntityReference[],
  ): PromiseResult<
    Result<
      TEntity,
      | typeof ErrorType.BadRequest
      | typeof ErrorType.NotFound
      | typeof ErrorType.NotAuthorized
      | typeof ErrorType.Generic
    >[],
    typeof ErrorType.Generic
  >;

  getEntities(
    query?: EntityQuery<TEntity['info']['type'], TComponent['type'], TEntity['info']['authKey']>,
    paging?: Paging,
  ): PromiseResult<
    Connection<Edge<TEntity, ErrorType>> | null,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  getEntitiesTotalCount(
    query?: EntitySharedQuery<
      TEntity['info']['type'],
      TComponent['type'],
      TEntity['info']['authKey']
    >,
  ): PromiseResult<
    number,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  getEntitiesSample(
    query?: EntitySharedQuery<
      TEntity['info']['type'],
      TComponent['type'],
      TEntity['info']['authKey']
    >,
    options?: EntitySamplingOptions,
  ): PromiseResult<
    EntitySamplingPayload<TEntity>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  createEntity<T extends Entity<string, object> = TEntity>(
    entity: Readonly<EntityCreate<T>>,
    options?: EntityMutationOptions,
  ): PromiseResult<
    EntityCreatePayload<T>,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.Conflict
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  updateEntity<T extends Entity<string, object> = TEntity>(
    entity: Readonly<EntityUpdate<T>>,
    options?: EntityMutationOptions,
  ): PromiseResult<
    EntityUpdatePayload<T>,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  upsertEntity<T extends Entity<string, object> = TEntity>(
    entity: Readonly<EntityUpsert<T>>,
    options?: EntityMutationOptions,
  ): PromiseResult<
    EntityUpsertPayload<T>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  getChangelogEvents(
    query?: ChangelogEventQuery,
    paging?: Paging,
  ): PromiseResult<
    Connection<Edge<ChangelogEvent, typeof ErrorType.Generic>> | null,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  getChangelogEventsTotalCount(
    query?: ChangelogEventQuery,
  ): PromiseResult<
    number,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  publishEntities(
    references: EntityVersionReference[],
  ): PromiseResult<
    EntityPublishPayload[],
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  unpublishEntities(
    references: EntityReference[],
  ): PromiseResult<
    EntityUnpublishPayload[],
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  archiveEntity(
    reference: EntityReference,
  ): PromiseResult<
    EntityArchivePayload,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  unarchiveEntity(
    reference: EntityReference,
  ): PromiseResult<
    EntityUnarchivePayload,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  processDirtyEntity(
    reference: EntityReference,
  ): PromiseResult<
    EntityProcessDirtyPayload | null,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  acquireAdvisoryLock(
    name: string,
    options: AdvisoryLockOptions,
  ): PromiseResult<
    AdvisoryLockPayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Conflict | typeof ErrorType.Generic
  >;

  renewAdvisoryLock(
    name: string,
    handle: number,
  ): PromiseResult<
    AdvisoryLockPayload,
    typeof ErrorType.BadRequest | typeof ErrorType.NotFound | typeof ErrorType.Generic
  >;

  releaseAdvisoryLock(
    name: string,
    handle: number,
  ): PromiseResult<
    AdvisoryLockReleasePayload,
    typeof ErrorType.BadRequest | typeof ErrorType.NotFound | typeof ErrorType.Generic
  >;

  toExceptionClient(): TExceptionClient;
}

export interface AdminExceptionClient<
  TEntity extends Entity<string, object> = Entity,
  TComponent extends Component<string, object> = Component,
  TUniqueIndex extends string = string,
> {
  client: Readonly<AdminClient<TEntity, TComponent, TUniqueIndex>>;

  getSchemaSpecification(options: {
    includeMigrations: true;
  }): Promise<SchemaSpecificationWithMigrations>;
  getSchemaSpecification(options?: { includeMigrations: boolean }): Promise<SchemaSpecification>;

  updateSchemaSpecification(
    schemaSpec: SchemaSpecificationUpdate,
    options: { includeMigrations: true },
  ): Promise<SchemaSpecificationUpdatePayload<SchemaSpecificationWithMigrations>>;
  updateSchemaSpecification(
    schemaSpec: SchemaSpecificationUpdate,
    options?: { includeMigrations: boolean },
  ): Promise<SchemaSpecificationUpdatePayload>;

  getEntity(
    reference: EntityReference | EntityVersionReference | UniqueIndexReference<TUniqueIndex>,
  ): Promise<TEntity>;

  getEntityList(
    references: EntityReference[],
  ): Promise<
    Result<
      TEntity,
      | typeof ErrorType.BadRequest
      | typeof ErrorType.NotFound
      | typeof ErrorType.NotAuthorized
      | typeof ErrorType.Generic
    >[]
  >;

  getEntities(
    query?: EntityQuery<TEntity['info']['type'], TComponent['type'], TEntity['info']['authKey']>,
    paging?: Paging,
  ): Promise<Connection<Edge<TEntity, ErrorType>> | null>;

  getEntitiesTotalCount(
    query?: EntitySharedQuery<
      TEntity['info']['type'],
      TComponent['type'],
      TEntity['info']['authKey']
    >,
  ): Promise<number>;

  getEntitiesSample(
    query?: EntitySharedQuery<
      TEntity['info']['type'],
      TComponent['type'],
      TEntity['info']['authKey']
    >,
    options?: EntitySamplingOptions,
  ): Promise<EntitySamplingPayload<TEntity>>;

  createEntity<T extends Entity<string, object> = TEntity>(
    entity: EntityCreate<T>,
    options?: EntityMutationOptions,
  ): Promise<EntityCreatePayload<T>>;

  updateEntity<T extends Entity<string, object> = TEntity>(
    entity: EntityUpdate<T>,
    options?: EntityMutationOptions,
  ): Promise<EntityUpdatePayload<T>>;

  upsertEntity<T extends Entity<string, object> = TEntity>(
    entity: EntityUpsert<T>,
    options?: EntityMutationOptions,
  ): Promise<EntityUpsertPayload<T>>;

  getChangelogEvents(
    query?: ChangelogEventQuery,
    paging?: Paging,
  ): Promise<Connection<Edge<ChangelogEvent, typeof ErrorType.Generic>> | null>;

  getChangelogEventsTotalCount(query?: ChangelogEventQuery): Promise<number>;

  publishEntities(references: EntityVersionReference[]): Promise<EntityPublishPayload[]>;

  unpublishEntities(references: EntityReference[]): Promise<EntityUnpublishPayload[]>;

  archiveEntity(reference: EntityReference): Promise<EntityArchivePayload>;

  unarchiveEntity(reference: EntityReference): Promise<EntityUnarchivePayload>;

  processDirtyEntity(reference: EntityReference): Promise<EntityProcessDirtyPayload | null>;

  acquireAdvisoryLock(name: string, options: AdvisoryLockOptions): Promise<AdvisoryLockPayload>;

  renewAdvisoryLock(name: string, handle: number): Promise<AdvisoryLockPayload>;

  releaseAdvisoryLock(name: string, handle: number): Promise<AdvisoryLockReleasePayload>;
}

export const AdminClientOperationName = {
  acquireAdvisoryLock: 'acquireAdvisoryLock',
  archiveEntity: 'archiveEntity',
  createEntity: 'createEntity',
  getChangelogEvents: 'getChangelogEvents',
  getChangelogEventsTotalCount: 'getChangelogEventsTotalCount',
  getEntities: 'getEntities',
  getEntitiesSample: 'getEntitiesSample',
  getEntitiesTotalCount: 'getEntitiesTotalCount',
  getEntity: 'getEntity',
  getEntityList: 'getEntityList',
  getSchemaSpecification: 'getSchemaSpecification',
  processDirtyEntity: 'processDirtyEntity',
  publishEntities: 'publishEntities',
  releaseAdvisoryLock: 'releaseAdvisoryLock',
  renewAdvisoryLock: 'renewAdvisoryLock',
  unarchiveEntity: 'unarchiveEntity',
  unpublishEntities: 'unpublishEntities',
  updateEntity: 'updateEntity',
  updateSchemaSpecification: 'updateSchemaSpecification',
  upsertEntity: 'upsertEntity',
} as const;
type AdminClientOperationName = keyof typeof AdminClientOperationName;

type MethodParameters<
  TName extends keyof AdminClient,
  TClient extends AdminClient<Entity<string, object>, Component<string, object>> = AdminClient,
> = Parameters<TClient[TName]>;
type MethodReturnType<TName extends keyof AdminClient> = PromiseResult<
  MethodReturnTypeOk<TName>,
  MethodReturnTypeError<TName>
>;
type MethodReturnTypeWithoutPromise<
  TName extends keyof AdminClient,
  TClient extends AdminClient<Entity<string, object>, Component<string, object>> = AdminClient,
> = Awaited<
  PromiseResult<MethodReturnTypeOk<TName, TClient>, MethodReturnTypeError<TName, TClient>>
>;
type MethodReturnTypeOk<
  TName extends keyof AdminClient,
  TClient extends AdminClient<Entity<string, object>, Component<string, object>> = AdminClient,
> = OkFromResult<ReturnType<TClient[TName]>>;
type MethodReturnTypeError<
  TName extends keyof AdminClient,
  TClient extends AdminClient<Entity<string, object>, Component<string, object>> = AdminClient,
> = ErrorFromResult<ReturnType<TClient[TName]>>;

interface AdminClientOperationArguments {
  [AdminClientOperationName.acquireAdvisoryLock]: MethodParameters<'acquireAdvisoryLock'>;
  [AdminClientOperationName.archiveEntity]: MethodParameters<'archiveEntity'>;
  [AdminClientOperationName.createEntity]: MethodParameters<'createEntity'>;
  [AdminClientOperationName.getChangelogEvents]: MethodParameters<'getChangelogEvents'>;
  [AdminClientOperationName.getChangelogEventsTotalCount]: MethodParameters<'getChangelogEventsTotalCount'>;
  [AdminClientOperationName.getEntities]: MethodParameters<'getEntities'>;
  [AdminClientOperationName.getEntitiesSample]: MethodParameters<'getEntitiesSample'>;
  [AdminClientOperationName.getEntitiesTotalCount]: MethodParameters<'getEntitiesTotalCount'>;
  [AdminClientOperationName.getEntity]: MethodParameters<'getEntity'>;
  [AdminClientOperationName.getEntityList]: MethodParameters<'getEntityList'>;
  [AdminClientOperationName.getSchemaSpecification]: MethodParameters<'getSchemaSpecification'>;
  [AdminClientOperationName.processDirtyEntity]: MethodParameters<'processDirtyEntity'>;
  [AdminClientOperationName.publishEntities]: MethodParameters<'publishEntities'>;
  [AdminClientOperationName.releaseAdvisoryLock]: MethodParameters<'releaseAdvisoryLock'>;
  [AdminClientOperationName.renewAdvisoryLock]: MethodParameters<'renewAdvisoryLock'>;
  [AdminClientOperationName.unarchiveEntity]: MethodParameters<'unarchiveEntity'>;
  [AdminClientOperationName.unpublishEntities]: MethodParameters<'unpublishEntities'>;
  [AdminClientOperationName.updateEntity]: MethodParameters<'updateEntity'>;
  [AdminClientOperationName.updateSchemaSpecification]: MethodParameters<'updateSchemaSpecification'>;
  [AdminClientOperationName.upsertEntity]: MethodParameters<'upsertEntity'>;
}

interface AdminClientOperationReturnOk {
  [AdminClientOperationName.acquireAdvisoryLock]: MethodReturnTypeOk<'acquireAdvisoryLock'>;
  [AdminClientOperationName.archiveEntity]: MethodReturnTypeOk<'archiveEntity'>;
  [AdminClientOperationName.createEntity]: MethodReturnTypeOk<'createEntity'>;
  [AdminClientOperationName.getChangelogEvents]: MethodReturnTypeOk<'getChangelogEvents'>;
  [AdminClientOperationName.getChangelogEventsTotalCount]: MethodReturnTypeOk<'getChangelogEventsTotalCount'>;
  [AdminClientOperationName.getEntities]: MethodReturnTypeOk<'getEntities'>;
  [AdminClientOperationName.getEntitiesSample]: MethodReturnTypeOk<'getEntitiesSample'>;
  [AdminClientOperationName.getEntitiesTotalCount]: MethodReturnTypeOk<'getEntitiesTotalCount'>;
  [AdminClientOperationName.getEntity]: MethodReturnTypeOk<'getEntity'>;
  [AdminClientOperationName.getEntityList]: MethodReturnTypeOk<'getEntityList'>;
  [AdminClientOperationName.getSchemaSpecification]: MethodReturnTypeOk<'getSchemaSpecification'>;
  [AdminClientOperationName.processDirtyEntity]: MethodReturnTypeOk<'processDirtyEntity'>;
  [AdminClientOperationName.publishEntities]: MethodReturnTypeOk<'publishEntities'>;
  [AdminClientOperationName.releaseAdvisoryLock]: MethodReturnTypeOk<'releaseAdvisoryLock'>;
  [AdminClientOperationName.renewAdvisoryLock]: MethodReturnTypeOk<'renewAdvisoryLock'>;
  [AdminClientOperationName.unarchiveEntity]: MethodReturnTypeOk<'unarchiveEntity'>;
  [AdminClientOperationName.unpublishEntities]: MethodReturnTypeOk<'unpublishEntities'>;
  [AdminClientOperationName.updateEntity]: MethodReturnTypeOk<'updateEntity'>;
  [AdminClientOperationName.updateSchemaSpecification]: MethodReturnTypeOk<'updateSchemaSpecification'>;
  [AdminClientOperationName.upsertEntity]: MethodReturnTypeOk<'upsertEntity'>;
}

interface AdminClientOperationReturnError {
  [AdminClientOperationName.acquireAdvisoryLock]: MethodReturnTypeError<'acquireAdvisoryLock'>;
  [AdminClientOperationName.archiveEntity]: MethodReturnTypeError<'archiveEntity'>;
  [AdminClientOperationName.createEntity]: MethodReturnTypeError<'createEntity'>;
  [AdminClientOperationName.getChangelogEvents]: MethodReturnTypeError<'getChangelogEvents'>;
  [AdminClientOperationName.getChangelogEventsTotalCount]: MethodReturnTypeError<'getChangelogEventsTotalCount'>;
  [AdminClientOperationName.getEntities]: MethodReturnTypeError<'getEntities'>;
  [AdminClientOperationName.getEntitiesSample]: MethodReturnTypeError<'getEntitiesSample'>;
  [AdminClientOperationName.getEntitiesTotalCount]: MethodReturnTypeError<'getEntitiesTotalCount'>;
  [AdminClientOperationName.getEntity]: MethodReturnTypeError<'getEntity'>;
  [AdminClientOperationName.getEntityList]: MethodReturnTypeError<'getEntityList'>;
  [AdminClientOperationName.getSchemaSpecification]: MethodReturnTypeError<'getSchemaSpecification'>;
  [AdminClientOperationName.processDirtyEntity]: MethodReturnTypeError<'processDirtyEntity'>;
  [AdminClientOperationName.publishEntities]: MethodReturnTypeError<'publishEntities'>;
  [AdminClientOperationName.releaseAdvisoryLock]: MethodReturnTypeError<'releaseAdvisoryLock'>;
  [AdminClientOperationName.renewAdvisoryLock]: MethodReturnTypeError<'renewAdvisoryLock'>;
  [AdminClientOperationName.unarchiveEntity]: MethodReturnTypeError<'unarchiveEntity'>;
  [AdminClientOperationName.unpublishEntities]: MethodReturnTypeError<'unpublishEntities'>;
  [AdminClientOperationName.updateEntity]: MethodReturnTypeError<'updateEntity'>;
  [AdminClientOperationName.updateSchemaSpecification]: MethodReturnTypeError<'updateSchemaSpecification'>;
  [AdminClientOperationName.upsertEntity]: MethodReturnTypeError<'upsertEntity'>;
}

export type AdminClientOperation<
  TName extends AdminClientOperationName = AdminClientOperationName,
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

export type AdminClientJsonOperationArgs<
  TName extends AdminClientOperationName = AdminClientOperationName,
> = AdminClientOperationArguments[TName];

export const AdminClientModifyingOperations: Readonly<Set<string>> = /* @__PURE__ */ (() =>
  new Set([
    AdminClientOperationName.acquireAdvisoryLock,
    AdminClientOperationName.archiveEntity,
    AdminClientOperationName.createEntity,
    AdminClientOperationName.processDirtyEntity,
    AdminClientOperationName.publishEntities,
    AdminClientOperationName.releaseAdvisoryLock,
    AdminClientOperationName.renewAdvisoryLock,
    AdminClientOperationName.unarchiveEntity,
    AdminClientOperationName.unpublishEntities,
    AdminClientOperationName.updateEntity,
    AdminClientOperationName.updateSchemaSpecification,
    AdminClientOperationName.upsertEntity,
  ] satisfies AdminClientOperationName[]))();

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

  getSchemaSpecification(options: {
    includeMigrations: true;
  }): PromiseResult<SchemaSpecificationWithMigrations, typeof ErrorType.Generic>;
  getSchemaSpecification(options?: {
    includeMigrations: boolean;
  }): PromiseResult<SchemaSpecification, typeof ErrorType.Generic> {
    return this.executeOperation({
      name: AdminClientOperationName.getSchemaSpecification,
      args: [options],
      modifies: false,
    });
  }

  updateSchemaSpecification(
    schemaSpec: SchemaSpecificationUpdate,
    options: { includeMigrations: true },
  ): PromiseResult<
    SchemaSpecificationUpdatePayload<SchemaSpecificationWithMigrations>,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;
  updateSchemaSpecification(
    schemaSpec: SchemaSpecificationUpdate,
    options?: { includeMigrations: boolean },
  ): PromiseResult<
    SchemaSpecificationUpdatePayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  > {
    return this.executeOperation({
      name: AdminClientOperationName.updateSchemaSpecification,
      args: [schemaSpec, options],
      modifies: true,
    });
  }

  getEntity(
    reference: EntityReference | EntityVersionReference,
  ): MethodReturnType<typeof AdminClientOperationName.getEntity> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntity,
      args: [reference],
      modifies: false,
    });
  }

  getEntityList(
    references: EntityReference[],
  ): MethodReturnType<typeof AdminClientOperationName.getEntityList> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntityList,
      args: [references],
      modifies: false,
    });
  }

  getEntities(
    query?: EntityQuery,
    paging?: Paging,
  ): MethodReturnType<typeof AdminClientOperationName.getEntities> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntities,
      args: [query, paging],
      modifies: false,
    });
  }

  getEntitiesTotalCount(
    query?: EntitySharedQuery,
  ): MethodReturnType<typeof AdminClientOperationName.getEntitiesTotalCount> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntitiesTotalCount,
      args: [query],
      modifies: false,
    });
  }

  getEntitiesSample(
    query?: EntitySharedQuery,
    options?: EntitySamplingOptions,
  ): PromiseResult<
    EntitySamplingPayload<Entity>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  > {
    return this.executeOperation({
      name: AdminClientOperationName.getEntitiesSample,
      args: [query, options],
      modifies: false,
    });
  }

  createEntity<T extends Entity<string, object> = Entity>(
    entity: EntityCreate<T>,
    options: EntityMutationOptions | undefined,
  ): PromiseResult<
    EntityCreatePayload<T>,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.Conflict
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  > {
    return this.executeOperation({
      name: AdminClientOperationName.createEntity,
      args: [entity, options],
      modifies: true,
    }) as PromiseResult<
      EntityCreatePayload<T>,
      | typeof ErrorType.BadRequest
      | typeof ErrorType.Conflict
      | typeof ErrorType.NotAuthorized
      | typeof ErrorType.Generic
    >;
  }

  updateEntity<T extends Entity<string, object> = Entity>(
    entity: EntityUpdate<T>,
    options: EntityMutationOptions | undefined,
  ): PromiseResult<
    EntityUpdatePayload<T>,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  > {
    return this.executeOperation({
      name: AdminClientOperationName.updateEntity,
      args: [entity, options],
      modifies: true,
    }) as PromiseResult<
      EntityUpdatePayload<T>,
      | typeof ErrorType.BadRequest
      | typeof ErrorType.NotFound
      | typeof ErrorType.NotAuthorized
      | typeof ErrorType.Generic
    >;
  }

  upsertEntity<T extends Entity<string, object> = Entity>(
    entity: EntityUpsert<T>,
    options: EntityMutationOptions | undefined,
  ): PromiseResult<
    EntityUpsertPayload<T>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  > {
    return this.executeOperation({
      name: AdminClientOperationName.upsertEntity,
      args: [entity, options],
      modifies: true,
    }) as PromiseResult<
      EntityUpsertPayload<T>,
      typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
    >;
  }

  getChangelogEvents(
    query?: ChangelogEventQuery,
    paging?: Paging,
  ): MethodReturnType<typeof AdminClientOperationName.getChangelogEvents> {
    return this.executeOperation({
      name: AdminClientOperationName.getChangelogEvents,
      args: [query, paging],
      modifies: false,
    });
  }

  getChangelogEventsTotalCount(
    query?: ChangelogEventQuery,
  ): MethodReturnType<typeof AdminClientOperationName.getChangelogEventsTotalCount> {
    return this.executeOperation({
      name: AdminClientOperationName.getChangelogEventsTotalCount,
      args: [query],
      modifies: false,
    });
  }

  publishEntities(
    references: EntityVersionReference[],
  ): MethodReturnType<typeof AdminClientOperationName.publishEntities> {
    return this.executeOperation({
      name: AdminClientOperationName.publishEntities,
      args: [references],
      modifies: true,
    });
  }

  unpublishEntities(
    references: EntityReference[],
  ): MethodReturnType<typeof AdminClientOperationName.unpublishEntities> {
    return this.executeOperation({
      name: AdminClientOperationName.unpublishEntities,
      args: [references],
      modifies: true,
    });
  }

  archiveEntity(
    reference: EntityReference,
  ): MethodReturnType<typeof AdminClientOperationName.archiveEntity> {
    return this.executeOperation({
      name: AdminClientOperationName.archiveEntity,
      args: [reference],
      modifies: true,
    });
  }

  unarchiveEntity(
    reference: EntityReference,
  ): MethodReturnType<typeof AdminClientOperationName.unarchiveEntity> {
    return this.executeOperation({
      name: AdminClientOperationName.unarchiveEntity,
      args: [reference],
      modifies: true,
    });
  }

  processDirtyEntity(
    reference: EntityReference,
  ): MethodReturnType<typeof AdminClientOperationName.processDirtyEntity> {
    return this.executeOperation({
      name: AdminClientOperationName.processDirtyEntity,
      args: [reference],
      modifies: true,
    });
  }

  acquireAdvisoryLock(
    name: string,
    options: AdvisoryLockOptions,
  ): PromiseResult<
    AdvisoryLockPayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Conflict | typeof ErrorType.Generic
  > {
    return this.executeOperation({
      name: AdminClientOperationName.acquireAdvisoryLock,
      args: [name, options],
      modifies: true,
    });
  }

  renewAdvisoryLock(
    name: string,
    handle: number,
  ): PromiseResult<
    AdvisoryLockPayload,
    typeof ErrorType.BadRequest | typeof ErrorType.NotFound | typeof ErrorType.Generic
  > {
    return this.executeOperation({
      name: AdminClientOperationName.renewAdvisoryLock,
      args: [name, handle],
      modifies: true,
    });
  }

  releaseAdvisoryLock(
    name: string,
    handle: number,
  ): PromiseResult<
    AdvisoryLockReleasePayload,
    typeof ErrorType.BadRequest | typeof ErrorType.NotFound | typeof ErrorType.Generic
  > {
    return this.executeOperation({
      name: AdminClientOperationName.releaseAdvisoryLock,
      args: [name, handle],
      modifies: true,
    });
  }

  toExceptionClient(): AdminExceptionClient {
    return new AdminExceptionClientWrapper(this);
  }

  private async executeOperation<TName extends AdminClientOperationName>(
    operation: OperationWithoutCallbacks<AdminClientOperation<TName>>,
  ): PromiseResult<AdminClientOperationReturnOk[TName], AdminClientOperationReturnError[TName]> {
    let context: TContext;
    if (typeof this.context === 'function') {
      const contextResult = await this.context();
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

class AdminExceptionClientWrapper implements AdminExceptionClient {
  readonly client: AdminClient;

  constructor(client: AdminClient) {
    this.client = client;
  }

  async getSchemaSpecification(options: {
    includeMigrations: true;
  }): Promise<SchemaSpecificationWithMigrations>;
  async getSchemaSpecification(options?: {
    includeMigrations: boolean;
  }): Promise<SchemaSpecification> {
    return (await this.client.getSchemaSpecification(options)).valueOrThrow();
  }

  async updateSchemaSpecification(
    schemaSpec: SchemaSpecificationUpdate,
    options: { includeMigrations: true },
  ): Promise<SchemaSpecificationUpdatePayload<SchemaSpecificationWithMigrations>>;
  async updateSchemaSpecification(
    schemaSpec: SchemaSpecificationUpdate,
    options?: { includeMigrations: boolean },
  ): Promise<SchemaSpecificationUpdatePayload> {
    return (await this.client.updateSchemaSpecification(schemaSpec, options)).valueOrThrow();
  }

  async getEntity(
    reference: EntityReference | EntityVersionReference | UniqueIndexReference<string>,
  ): Promise<Entity<string, Record<string, unknown>, string>> {
    return (await this.client.getEntity(reference)).valueOrThrow();
  }

  async getEntityList(
    references: EntityReference[],
  ): Promise<
    Result<
      Entity<string, Record<string, unknown>, string>,
      'BadRequest' | 'NotAuthorized' | 'NotFound' | 'Generic'
    >[]
  > {
    return (await this.client.getEntityList(references)).valueOrThrow();
  }

  async getEntities(
    query?: EntityQuery<string, string> | undefined,
    paging?: Paging | undefined,
  ): Promise<Connection<Edge<Entity<string, Record<string, unknown>, string>, ErrorType>> | null> {
    return (await this.client.getEntities(query, paging)).valueOrThrow();
  }

  async getEntitiesTotalCount(
    query?: EntitySharedQuery<string, string> | undefined,
  ): Promise<number> {
    return (await this.client.getEntitiesTotalCount(query)).valueOrThrow();
  }

  async getEntitiesSample(
    query?: EntitySharedQuery<string, string> | undefined,
    options?: EntitySamplingOptions | undefined,
  ): Promise<EntitySamplingPayload<Entity<string, Record<string, unknown>, string>>> {
    return (await this.client.getEntitiesSample(query, options)).valueOrThrow();
  }

  async createEntity<
    T extends Entity<string, object, string> = Entity<string, Record<string, unknown>, string>,
  >(
    entity: EntityCreate<T>,
    options?: EntityMutationOptions | undefined,
  ): Promise<EntityCreatePayload<T>> {
    return (await this.client.createEntity(entity, options)).valueOrThrow();
  }

  async updateEntity<
    T extends Entity<string, object, string> = Entity<string, Record<string, unknown>, string>,
  >(
    entity: EntityUpdate<T>,
    options?: EntityMutationOptions | undefined,
  ): Promise<EntityUpdatePayload<T>> {
    return (await this.client.updateEntity(entity, options)).valueOrThrow();
  }

  async upsertEntity<
    T extends Entity<string, object, string> = Entity<string, Record<string, unknown>, string>,
  >(
    entity: EntityUpsert<T>,
    options?: EntityMutationOptions | undefined,
  ): Promise<EntityUpsertPayload<T>> {
    return (await this.client.upsertEntity(entity, options)).valueOrThrow();
  }

  async getChangelogEvents(
    query?: ChangelogEventQuery,
    paging?: Paging,
  ): Promise<Connection<Edge<ChangelogEvent, typeof ErrorType.Generic>> | null> {
    return (await this.client.getChangelogEvents(query, paging)).valueOrThrow();
  }

  async getChangelogEventsTotalCount(query?: ChangelogEventQuery): Promise<number> {
    return (await this.client.getChangelogEventsTotalCount(query)).valueOrThrow();
  }

  async publishEntities(references: EntityVersionReference[]): Promise<EntityPublishPayload[]> {
    return (await this.client.publishEntities(references)).valueOrThrow();
  }

  async unpublishEntities(references: EntityReference[]): Promise<EntityUnpublishPayload[]> {
    return (await this.client.unpublishEntities(references)).valueOrThrow();
  }

  async archiveEntity(reference: EntityReference): Promise<EntityArchivePayload> {
    return (await this.client.archiveEntity(reference)).valueOrThrow();
  }

  async unarchiveEntity(reference: EntityReference): Promise<EntityUnarchivePayload> {
    return (await this.client.unarchiveEntity(reference)).valueOrThrow();
  }

  async processDirtyEntity(reference: EntityReference): Promise<EntityProcessDirtyPayload | null> {
    return (await this.client.processDirtyEntity(reference)).valueOrThrow();
  }

  async acquireAdvisoryLock(
    name: string,
    options: AdvisoryLockOptions,
  ): Promise<AdvisoryLockPayload> {
    return (await this.client.acquireAdvisoryLock(name, options)).valueOrThrow();
  }

  async renewAdvisoryLock(name: string, handle: number): Promise<AdvisoryLockPayload> {
    return (await this.client.renewAdvisoryLock(name, handle)).valueOrThrow();
  }

  async releaseAdvisoryLock(name: string, handle: number): Promise<AdvisoryLockReleasePayload> {
    return (await this.client.releaseAdvisoryLock(name, handle)).valueOrThrow();
  }
}

export function createBaseAdminClient<
  TContext extends ClientContext,
  TClient extends AdminClient<Entity<string, object>, Component<string, object>> = AdminClient,
>(option: {
  context: TContext | ContextProvider<TContext>;
  pipeline: AdminClientMiddleware<TContext>[];
}): TClient {
  return new BaseAdminClient(option) as unknown as TClient;
}

export async function executeAdminClientOperationFromJson(
  adminClient: AdminClient<Entity<string, object>, Component<string, object>>,
  operationName: LooseAutocomplete<AdminClientOperationName>,
  operationArgs: AdminClientJsonOperationArgs,
): PromiseResult<unknown, ErrorType> {
  const name = operationName as AdminClientOperationName;
  switch (name) {
    case AdminClientOperationName.acquireAdvisoryLock: {
      const [name, options] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.acquireAdvisoryLock];
      return await adminClient.acquireAdvisoryLock(name, options);
    }
    case AdminClientOperationName.archiveEntity: {
      const [reference] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.archiveEntity];
      return await adminClient.archiveEntity(reference);
    }
    case AdminClientOperationName.createEntity: {
      const [entity, options] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.createEntity];
      return await adminClient.createEntity(entity, options);
    }
    case AdminClientOperationName.getChangelogEvents: {
      const [query, paging] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.getChangelogEvents];
      return await adminClient.getChangelogEvents(query, paging);
    }
    case AdminClientOperationName.getChangelogEventsTotalCount: {
      const [query] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.getChangelogEventsTotalCount];
      return await adminClient.getChangelogEventsTotalCount(query);
    }
    case AdminClientOperationName.getEntities: {
      const [query, paging] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.getEntities];
      return await adminClient.getEntities(query, paging);
    }
    case AdminClientOperationName.getEntitiesSample: {
      const [query, options] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.getEntitiesSample];
      return await adminClient.getEntitiesSample(query, options);
    }
    case AdminClientOperationName.getEntitiesTotalCount: {
      const [query] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.getEntitiesTotalCount];
      return await adminClient.getEntitiesTotalCount(query);
    }
    case AdminClientOperationName.getEntity: {
      const [reference] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.getEntity];
      return await adminClient.getEntity(reference);
    }
    case AdminClientOperationName.getEntityList: {
      const [references] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.getEntityList];
      return await adminClient.getEntityList(references);
    }
    case AdminClientOperationName.getSchemaSpecification: {
      const [options] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.getSchemaSpecification];
      return await adminClient.getSchemaSpecification(options);
    }
    case AdminClientOperationName.processDirtyEntity: {
      const [reference] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.processDirtyEntity];
      return await adminClient.processDirtyEntity(reference);
    }
    case AdminClientOperationName.publishEntities: {
      const [references] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.publishEntities];
      return await adminClient.publishEntities(references);
    }
    case AdminClientOperationName.releaseAdvisoryLock: {
      const [name, handle] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.releaseAdvisoryLock];
      return await adminClient.releaseAdvisoryLock(name, handle);
    }
    case AdminClientOperationName.renewAdvisoryLock: {
      const [name, handle] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.renewAdvisoryLock];
      return await adminClient.renewAdvisoryLock(name, handle);
    }
    case AdminClientOperationName.unarchiveEntity: {
      const [reference] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.unarchiveEntity];
      return await adminClient.unarchiveEntity(reference);
    }
    case AdminClientOperationName.unpublishEntities: {
      const [references] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.unpublishEntities];
      return await adminClient.unpublishEntities(references);
    }
    case AdminClientOperationName.updateEntity: {
      const [entity, options] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.updateEntity];
      return await adminClient.updateEntity(entity, options);
    }
    case AdminClientOperationName.updateSchemaSpecification: {
      const [schemaSpec, options] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.updateSchemaSpecification];
      return await adminClient.updateSchemaSpecification(schemaSpec, options);
    }
    case AdminClientOperationName.upsertEntity: {
      const [entity, options] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.upsertEntity];
      return await adminClient.upsertEntity(entity, options);
    }
    default: {
      name satisfies never;
      return notOk.BadRequest(`Unknown operation ${operationName}`);
    }
  }
}

export function convertJsonAdminClientResult<
  TName extends AdminClientOperationName,
  TClient extends AdminClient<Entity<string, object>, Component<string, object>> = AdminClient,
>(
  operationName: TName,
  jsonResult: Result<unknown, ErrorType>,
): MethodReturnTypeWithoutPromise<TName, TClient> {
  if (jsonResult.isError()) {
    //TODO check expected types
    return jsonResult as MethodReturnTypeWithoutPromise<TName, TClient>;
  }
  const { value } = jsonResult;
  switch (operationName) {
    case AdminClientOperationName.acquireAdvisoryLock: {
      const result: MethodReturnTypeWithoutPromise<
        typeof AdminClientOperationName.acquireAdvisoryLock
      > = ok(value as AdvisoryLockPayload);
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.archiveEntity: {
      const result: MethodReturnTypeWithoutPromise<typeof AdminClientOperationName.archiveEntity> =
        ok(
          convertJsonPublishingResult(
            value as JsonPublishingResult<EntityArchivePayload['effect']>,
          ),
        );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.createEntity: {
      const valueTyped = value as JsonEntityCreatePayload;
      const result: MethodReturnTypeWithoutPromise<typeof AdminClientOperationName.createEntity> =
        ok({
          ...valueTyped,
          entity: convertJsonEntity(valueTyped.entity),
        });
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.getChangelogEvents: {
      const result: MethodReturnTypeWithoutPromise<
        typeof AdminClientOperationName.getChangelogEvents
      > = ok(
        convertJsonConnection(
          value as JsonConnection<JsonEdge<JsonChangelogEvent, typeof ErrorType.Generic>> | null,
          convertJsonChangelogEventEdge,
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.getChangelogEventsTotalCount: {
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.getEntities: {
      const result: MethodReturnTypeWithoutPromise<typeof AdminClientOperationName.getEntities> =
        ok(
          convertJsonConnection(
            value as JsonConnection<JsonEdge<JsonEntity, ErrorType>> | null,
            convertJsonAdminEntityEdge,
          ),
        );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.getEntitiesSample: {
      const payload = value as EntitySamplingPayload<JsonEntity>;
      const result: MethodReturnTypeWithoutPromise<
        typeof AdminClientOperationName.getEntitiesSample
      > = ok({
        ...payload,
        items: payload.items.map((it) => convertJsonEntity(it)),
      });
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.getEntitiesTotalCount:
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;

    case AdminClientOperationName.getEntity: {
      const result: MethodReturnTypeWithoutPromise<typeof AdminClientOperationName.getEntity> = ok(
        convertJsonEntity(value as JsonEntity),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.getEntityList: {
      const result: MethodReturnTypeWithoutPromise<typeof AdminClientOperationName.getEntityList> =
        ok(
          (value as JsonResult<JsonEntity, typeof ErrorType.NotFound>[]).map((jsonItemResult) => {
            const itemResult = convertJsonResult(jsonItemResult);
            return itemResult.isOk() ? itemResult.map(convertJsonEntity) : itemResult;
          }),
        );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.getSchemaSpecification:
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;
    case AdminClientOperationName.processDirtyEntity: {
      const result: MethodReturnTypeWithoutPromise<
        typeof AdminClientOperationName.processDirtyEntity
      > = ok(value as EntityProcessDirtyPayload);
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.publishEntities: {
      const result: MethodReturnTypeWithoutPromise<
        typeof AdminClientOperationName.publishEntities
      > = ok(
        (value as JsonPublishingResult<EntityPublishPayload['effect']>[]).map(
          convertJsonPublishingResult,
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.releaseAdvisoryLock: {
      const result: MethodReturnTypeWithoutPromise<
        typeof AdminClientOperationName.releaseAdvisoryLock
      > = ok(value as AdvisoryLockReleasePayload);
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.renewAdvisoryLock: {
      const result: MethodReturnTypeWithoutPromise<
        typeof AdminClientOperationName.renewAdvisoryLock
      > = ok(value as AdvisoryLockPayload);
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.unarchiveEntity: {
      const result: MethodReturnTypeWithoutPromise<
        typeof AdminClientOperationName.unarchiveEntity
      > = ok(
        convertJsonPublishingResult(
          value as JsonPublishingResult<EntityUnarchivePayload['effect']>,
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.unpublishEntities: {
      const result: MethodReturnTypeWithoutPromise<
        typeof AdminClientOperationName.unpublishEntities
      > = ok(
        (value as JsonPublishingResult<EntityUnpublishPayload['effect']>[]).map(
          convertJsonPublishingResult,
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.updateEntity: {
      const valueTyped = value as JsonEntityUpdatePayload;
      const result: MethodReturnTypeWithoutPromise<typeof AdminClientOperationName.updateEntity> =
        ok({
          ...valueTyped,
          entity: convertJsonEntity(valueTyped.entity),
        });
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.updateSchemaSpecification:
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;
    case AdminClientOperationName.upsertEntity: {
      const valueTyped = value as JsonEntityUpsertPayload;
      const result: MethodReturnTypeWithoutPromise<typeof AdminClientOperationName.upsertEntity> =
        ok({
          ...valueTyped,
          entity: convertJsonEntity(valueTyped.entity),
        });
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    default: {
      operationName satisfies never;
      return notOk.Generic(`Unknown operation ${operationName}`) as MethodReturnTypeWithoutPromise<
        TName,
        TClient
      >;
    }
  }
}

function convertJsonAdminEntityEdge(edge: JsonEdge<JsonEntity, ErrorType>) {
  return convertJsonEdge(edge, convertJsonEntity);
}
