import {
  ErrorType,
  notOk,
  ok,
  type ErrorFromResult,
  type OkFromResult,
  type PromiseResult,
  type Result,
} from '../ErrorResult.js';
import type { ChangelogEvent, ChangelogEventQuery } from '../events/EventTypes.js';
import type {
  SchemaSpecification,
  SchemaSpecificationUpdate,
  SchemaSpecificationUpdatePayload,
  SchemaSpecificationWithMigrations,
} from '../schema/SchemaSpecification.js';
import type {
  AdvisoryLockOptions,
  AdvisoryLockPayload,
  AdvisoryLockReleasePayload,
  Component,
  Connection,
  Edge,
  Entity,
  EntityArchivePayload,
  EntityCreate,
  EntityCreatePayload,
  EntityMutationOptions,
  EntityProcessDirtyPayload,
  EntityPublishPayload,
  EntityQuery,
  EntityReference,
  EntitySamplingOptions,
  EntitySamplingPayload,
  EntitySharedQuery,
  EntityUnarchivePayload,
  EntityUnpublishPayload,
  EntityUpdate,
  EntityUpdatePayload,
  EntityUpsert,
  EntityUpsertPayload,
  EntityVersionReference,
  Paging,
  UniqueIndexReference,
} from '../Types.js';
import type { LooseAutocomplete } from '../utils/TypeUtils.js';
import {
  convertJsonChangelogEventEdge,
  convertJsonConnection,
  convertJsonEdge,
  convertJsonEntity,
  convertJsonPublishingResult,
  convertJsonResult,
  type JsonChangelogEvent,
  type JsonConnection,
  type JsonEdge,
  type JsonEntity,
  type JsonEntityCreatePayload,
  type JsonEntityUpdatePayload,
  type JsonEntityUpsertPayload,
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

export interface DossierClient<
  TEntity extends Entity<string, object> = Entity,
  TComponent extends Component<string, object> = Component,
  TUniqueIndex extends string = string,
  TExceptionClient extends DossierExceptionClient<
    TEntity,
    TComponent,
    TUniqueIndex
  > = DossierExceptionClient<TEntity, TComponent, TUniqueIndex>,
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

export interface DossierExceptionClient<
  TEntity extends Entity<string, object> = Entity,
  TComponent extends Component<string, object> = Component,
  TUniqueIndex extends string = string,
> {
  client: Readonly<DossierClient<TEntity, TComponent, TUniqueIndex>>;

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

export const DossierClientOperationName = {
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
type DossierClientOperationName = keyof typeof DossierClientOperationName;

type MethodParameters<
  TName extends keyof DossierClient,
  TClient extends DossierClient<Entity<string, object>, Component<string, object>> = DossierClient,
> = Parameters<TClient[TName]>;
type MethodReturnType<TName extends keyof DossierClient> = PromiseResult<
  MethodReturnTypeOk<TName>,
  MethodReturnTypeError<TName>
>;
type MethodReturnTypeWithoutPromise<
  TName extends keyof DossierClient,
  TClient extends DossierClient<Entity<string, object>, Component<string, object>> = DossierClient,
> = Awaited<
  PromiseResult<MethodReturnTypeOk<TName, TClient>, MethodReturnTypeError<TName, TClient>>
>;
type MethodReturnTypeOk<
  TName extends keyof DossierClient,
  TClient extends DossierClient<Entity<string, object>, Component<string, object>> = DossierClient,
> = OkFromResult<ReturnType<TClient[TName]>>;
type MethodReturnTypeError<
  TName extends keyof DossierClient,
  TClient extends DossierClient<Entity<string, object>, Component<string, object>> = DossierClient,
> = ErrorFromResult<ReturnType<TClient[TName]>>;

interface DossierClientOperationArguments {
  [DossierClientOperationName.acquireAdvisoryLock]: MethodParameters<'acquireAdvisoryLock'>;
  [DossierClientOperationName.archiveEntity]: MethodParameters<'archiveEntity'>;
  [DossierClientOperationName.createEntity]: MethodParameters<'createEntity'>;
  [DossierClientOperationName.getChangelogEvents]: MethodParameters<'getChangelogEvents'>;
  [DossierClientOperationName.getChangelogEventsTotalCount]: MethodParameters<'getChangelogEventsTotalCount'>;
  [DossierClientOperationName.getEntities]: MethodParameters<'getEntities'>;
  [DossierClientOperationName.getEntitiesSample]: MethodParameters<'getEntitiesSample'>;
  [DossierClientOperationName.getEntitiesTotalCount]: MethodParameters<'getEntitiesTotalCount'>;
  [DossierClientOperationName.getEntity]: MethodParameters<'getEntity'>;
  [DossierClientOperationName.getEntityList]: MethodParameters<'getEntityList'>;
  [DossierClientOperationName.getSchemaSpecification]: MethodParameters<'getSchemaSpecification'>;
  [DossierClientOperationName.processDirtyEntity]: MethodParameters<'processDirtyEntity'>;
  [DossierClientOperationName.publishEntities]: MethodParameters<'publishEntities'>;
  [DossierClientOperationName.releaseAdvisoryLock]: MethodParameters<'releaseAdvisoryLock'>;
  [DossierClientOperationName.renewAdvisoryLock]: MethodParameters<'renewAdvisoryLock'>;
  [DossierClientOperationName.unarchiveEntity]: MethodParameters<'unarchiveEntity'>;
  [DossierClientOperationName.unpublishEntities]: MethodParameters<'unpublishEntities'>;
  [DossierClientOperationName.updateEntity]: MethodParameters<'updateEntity'>;
  [DossierClientOperationName.updateSchemaSpecification]: MethodParameters<'updateSchemaSpecification'>;
  [DossierClientOperationName.upsertEntity]: MethodParameters<'upsertEntity'>;
}

interface DossierClientOperationReturnOk {
  [DossierClientOperationName.acquireAdvisoryLock]: MethodReturnTypeOk<'acquireAdvisoryLock'>;
  [DossierClientOperationName.archiveEntity]: MethodReturnTypeOk<'archiveEntity'>;
  [DossierClientOperationName.createEntity]: MethodReturnTypeOk<'createEntity'>;
  [DossierClientOperationName.getChangelogEvents]: MethodReturnTypeOk<'getChangelogEvents'>;
  [DossierClientOperationName.getChangelogEventsTotalCount]: MethodReturnTypeOk<'getChangelogEventsTotalCount'>;
  [DossierClientOperationName.getEntities]: MethodReturnTypeOk<'getEntities'>;
  [DossierClientOperationName.getEntitiesSample]: MethodReturnTypeOk<'getEntitiesSample'>;
  [DossierClientOperationName.getEntitiesTotalCount]: MethodReturnTypeOk<'getEntitiesTotalCount'>;
  [DossierClientOperationName.getEntity]: MethodReturnTypeOk<'getEntity'>;
  [DossierClientOperationName.getEntityList]: MethodReturnTypeOk<'getEntityList'>;
  [DossierClientOperationName.getSchemaSpecification]: MethodReturnTypeOk<'getSchemaSpecification'>;
  [DossierClientOperationName.processDirtyEntity]: MethodReturnTypeOk<'processDirtyEntity'>;
  [DossierClientOperationName.publishEntities]: MethodReturnTypeOk<'publishEntities'>;
  [DossierClientOperationName.releaseAdvisoryLock]: MethodReturnTypeOk<'releaseAdvisoryLock'>;
  [DossierClientOperationName.renewAdvisoryLock]: MethodReturnTypeOk<'renewAdvisoryLock'>;
  [DossierClientOperationName.unarchiveEntity]: MethodReturnTypeOk<'unarchiveEntity'>;
  [DossierClientOperationName.unpublishEntities]: MethodReturnTypeOk<'unpublishEntities'>;
  [DossierClientOperationName.updateEntity]: MethodReturnTypeOk<'updateEntity'>;
  [DossierClientOperationName.updateSchemaSpecification]: MethodReturnTypeOk<'updateSchemaSpecification'>;
  [DossierClientOperationName.upsertEntity]: MethodReturnTypeOk<'upsertEntity'>;
}

interface DossierClientOperationReturnError {
  [DossierClientOperationName.acquireAdvisoryLock]: MethodReturnTypeError<'acquireAdvisoryLock'>;
  [DossierClientOperationName.archiveEntity]: MethodReturnTypeError<'archiveEntity'>;
  [DossierClientOperationName.createEntity]: MethodReturnTypeError<'createEntity'>;
  [DossierClientOperationName.getChangelogEvents]: MethodReturnTypeError<'getChangelogEvents'>;
  [DossierClientOperationName.getChangelogEventsTotalCount]: MethodReturnTypeError<'getChangelogEventsTotalCount'>;
  [DossierClientOperationName.getEntities]: MethodReturnTypeError<'getEntities'>;
  [DossierClientOperationName.getEntitiesSample]: MethodReturnTypeError<'getEntitiesSample'>;
  [DossierClientOperationName.getEntitiesTotalCount]: MethodReturnTypeError<'getEntitiesTotalCount'>;
  [DossierClientOperationName.getEntity]: MethodReturnTypeError<'getEntity'>;
  [DossierClientOperationName.getEntityList]: MethodReturnTypeError<'getEntityList'>;
  [DossierClientOperationName.getSchemaSpecification]: MethodReturnTypeError<'getSchemaSpecification'>;
  [DossierClientOperationName.processDirtyEntity]: MethodReturnTypeError<'processDirtyEntity'>;
  [DossierClientOperationName.publishEntities]: MethodReturnTypeError<'publishEntities'>;
  [DossierClientOperationName.releaseAdvisoryLock]: MethodReturnTypeError<'releaseAdvisoryLock'>;
  [DossierClientOperationName.renewAdvisoryLock]: MethodReturnTypeError<'renewAdvisoryLock'>;
  [DossierClientOperationName.unarchiveEntity]: MethodReturnTypeError<'unarchiveEntity'>;
  [DossierClientOperationName.unpublishEntities]: MethodReturnTypeError<'unpublishEntities'>;
  [DossierClientOperationName.updateEntity]: MethodReturnTypeError<'updateEntity'>;
  [DossierClientOperationName.updateSchemaSpecification]: MethodReturnTypeError<'updateSchemaSpecification'>;
  [DossierClientOperationName.upsertEntity]: MethodReturnTypeError<'upsertEntity'>;
}

export type DossierClientOperation<
  TName extends DossierClientOperationName = DossierClientOperationName,
> = Operation<
  TName,
  DossierClientOperationArguments[TName],
  DossierClientOperationReturnOk[TName],
  DossierClientOperationReturnError[TName]
>;

export type DossierClientMiddleware<TContext extends ClientContext> = Middleware<
  TContext,
  DossierClientOperation
>;

export type JsonDossierClientOperationArgs<
  TName extends DossierClientOperationName = DossierClientOperationName,
> = DossierClientOperationArguments[TName];

export const DossierClientModifyingOperations: Readonly<Set<string>> = /* @__PURE__ */ (() =>
  new Set([
    DossierClientOperationName.acquireAdvisoryLock,
    DossierClientOperationName.archiveEntity,
    DossierClientOperationName.createEntity,
    DossierClientOperationName.processDirtyEntity,
    DossierClientOperationName.publishEntities,
    DossierClientOperationName.releaseAdvisoryLock,
    DossierClientOperationName.renewAdvisoryLock,
    DossierClientOperationName.unarchiveEntity,
    DossierClientOperationName.unpublishEntities,
    DossierClientOperationName.updateEntity,
    DossierClientOperationName.updateSchemaSpecification,
    DossierClientOperationName.upsertEntity,
  ] satisfies DossierClientOperationName[]))();

class BaseDossierClient<TContext extends ClientContext> implements DossierClient {
  private readonly context: TContext | ContextProvider<TContext>;
  private readonly pipeline: DossierClientMiddleware<TContext>[];

  constructor({
    context,
    pipeline,
  }: {
    context: TContext | ContextProvider<TContext>;
    pipeline: DossierClientMiddleware<TContext>[];
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
      name: DossierClientOperationName.getSchemaSpecification,
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
      name: DossierClientOperationName.updateSchemaSpecification,
      args: [schemaSpec, options],
      modifies: true,
    });
  }

  getEntity(
    reference: EntityReference | EntityVersionReference,
  ): MethodReturnType<typeof DossierClientOperationName.getEntity> {
    return this.executeOperation({
      name: DossierClientOperationName.getEntity,
      args: [reference],
      modifies: false,
    });
  }

  getEntityList(
    references: EntityReference[],
  ): MethodReturnType<typeof DossierClientOperationName.getEntityList> {
    return this.executeOperation({
      name: DossierClientOperationName.getEntityList,
      args: [references],
      modifies: false,
    });
  }

  getEntities(
    query?: EntityQuery,
    paging?: Paging,
  ): MethodReturnType<typeof DossierClientOperationName.getEntities> {
    return this.executeOperation({
      name: DossierClientOperationName.getEntities,
      args: [query, paging],
      modifies: false,
    });
  }

  getEntitiesTotalCount(
    query?: EntitySharedQuery,
  ): MethodReturnType<typeof DossierClientOperationName.getEntitiesTotalCount> {
    return this.executeOperation({
      name: DossierClientOperationName.getEntitiesTotalCount,
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
      name: DossierClientOperationName.getEntitiesSample,
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
      name: DossierClientOperationName.createEntity,
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
      name: DossierClientOperationName.updateEntity,
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
      name: DossierClientOperationName.upsertEntity,
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
  ): MethodReturnType<typeof DossierClientOperationName.getChangelogEvents> {
    return this.executeOperation({
      name: DossierClientOperationName.getChangelogEvents,
      args: [query, paging],
      modifies: false,
    });
  }

  getChangelogEventsTotalCount(
    query?: ChangelogEventQuery,
  ): MethodReturnType<typeof DossierClientOperationName.getChangelogEventsTotalCount> {
    return this.executeOperation({
      name: DossierClientOperationName.getChangelogEventsTotalCount,
      args: [query],
      modifies: false,
    });
  }

  publishEntities(
    references: EntityVersionReference[],
  ): MethodReturnType<typeof DossierClientOperationName.publishEntities> {
    return this.executeOperation({
      name: DossierClientOperationName.publishEntities,
      args: [references],
      modifies: true,
    });
  }

  unpublishEntities(
    references: EntityReference[],
  ): MethodReturnType<typeof DossierClientOperationName.unpublishEntities> {
    return this.executeOperation({
      name: DossierClientOperationName.unpublishEntities,
      args: [references],
      modifies: true,
    });
  }

  archiveEntity(
    reference: EntityReference,
  ): MethodReturnType<typeof DossierClientOperationName.archiveEntity> {
    return this.executeOperation({
      name: DossierClientOperationName.archiveEntity,
      args: [reference],
      modifies: true,
    });
  }

  unarchiveEntity(
    reference: EntityReference,
  ): MethodReturnType<typeof DossierClientOperationName.unarchiveEntity> {
    return this.executeOperation({
      name: DossierClientOperationName.unarchiveEntity,
      args: [reference],
      modifies: true,
    });
  }

  processDirtyEntity(
    reference: EntityReference,
  ): MethodReturnType<typeof DossierClientOperationName.processDirtyEntity> {
    return this.executeOperation({
      name: DossierClientOperationName.processDirtyEntity,
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
      name: DossierClientOperationName.acquireAdvisoryLock,
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
      name: DossierClientOperationName.renewAdvisoryLock,
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
      name: DossierClientOperationName.releaseAdvisoryLock,
      args: [name, handle],
      modifies: true,
    });
  }

  toExceptionClient(): DossierExceptionClient {
    return new DossierExceptionClientWrapper(this);
  }

  private async executeOperation<TName extends DossierClientOperationName>(
    operation: OperationWithoutCallbacks<DossierClientOperation<TName>>,
  ): PromiseResult<
    DossierClientOperationReturnOk[TName],
    DossierClientOperationReturnError[TName]
  > {
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

class DossierExceptionClientWrapper implements DossierExceptionClient {
  readonly client: DossierClient;

  constructor(client: DossierClient) {
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

export function createBaseDossierClient<
  TContext extends ClientContext,
  TClient extends DossierClient<Entity<string, object>, Component<string, object>> = DossierClient,
>(option: {
  context: TContext | ContextProvider<TContext>;
  pipeline: DossierClientMiddleware<TContext>[];
}): TClient {
  return new BaseDossierClient(option) as unknown as TClient;
}

export async function executeJsonDossierClientOperation(
  client: DossierClient<Entity<string, object>, Component<string, object>>,
  operationName: LooseAutocomplete<DossierClientOperationName>,
  operationArgs: JsonDossierClientOperationArgs,
): PromiseResult<unknown, ErrorType> {
  const name = operationName as DossierClientOperationName;
  switch (name) {
    case DossierClientOperationName.acquireAdvisoryLock: {
      const [name, options] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.acquireAdvisoryLock];
      return await client.acquireAdvisoryLock(name, options);
    }
    case DossierClientOperationName.archiveEntity: {
      const [reference] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.archiveEntity];
      return await client.archiveEntity(reference);
    }
    case DossierClientOperationName.createEntity: {
      const [entity, options] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.createEntity];
      return await client.createEntity(entity, options);
    }
    case DossierClientOperationName.getChangelogEvents: {
      const [query, paging] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.getChangelogEvents];
      return await client.getChangelogEvents(query, paging);
    }
    case DossierClientOperationName.getChangelogEventsTotalCount: {
      const [query] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.getChangelogEventsTotalCount];
      return await client.getChangelogEventsTotalCount(query);
    }
    case DossierClientOperationName.getEntities: {
      const [query, paging] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.getEntities];
      return await client.getEntities(query, paging);
    }
    case DossierClientOperationName.getEntitiesSample: {
      const [query, options] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.getEntitiesSample];
      return await client.getEntitiesSample(query, options);
    }
    case DossierClientOperationName.getEntitiesTotalCount: {
      const [query] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.getEntitiesTotalCount];
      return await client.getEntitiesTotalCount(query);
    }
    case DossierClientOperationName.getEntity: {
      const [reference] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.getEntity];
      return await client.getEntity(reference);
    }
    case DossierClientOperationName.getEntityList: {
      const [references] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.getEntityList];
      return await client.getEntityList(references);
    }
    case DossierClientOperationName.getSchemaSpecification: {
      const [options] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.getSchemaSpecification];
      return await client.getSchemaSpecification(options);
    }
    case DossierClientOperationName.processDirtyEntity: {
      const [reference] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.processDirtyEntity];
      return await client.processDirtyEntity(reference);
    }
    case DossierClientOperationName.publishEntities: {
      const [references] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.publishEntities];
      return await client.publishEntities(references);
    }
    case DossierClientOperationName.releaseAdvisoryLock: {
      const [name, handle] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.releaseAdvisoryLock];
      return await client.releaseAdvisoryLock(name, handle);
    }
    case DossierClientOperationName.renewAdvisoryLock: {
      const [name, handle] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.renewAdvisoryLock];
      return await client.renewAdvisoryLock(name, handle);
    }
    case DossierClientOperationName.unarchiveEntity: {
      const [reference] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.unarchiveEntity];
      return await client.unarchiveEntity(reference);
    }
    case DossierClientOperationName.unpublishEntities: {
      const [references] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.unpublishEntities];
      return await client.unpublishEntities(references);
    }
    case DossierClientOperationName.updateEntity: {
      const [entity, options] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.updateEntity];
      return await client.updateEntity(entity, options);
    }
    case DossierClientOperationName.updateSchemaSpecification: {
      const [schemaSpec, options] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.updateSchemaSpecification];
      return await client.updateSchemaSpecification(schemaSpec, options);
    }
    case DossierClientOperationName.upsertEntity: {
      const [entity, options] =
        operationArgs as DossierClientOperationArguments[typeof DossierClientOperationName.upsertEntity];
      return await client.upsertEntity(entity, options);
    }
    default: {
      name satisfies never;
      return notOk.BadRequest(`Unknown operation ${operationName}`);
    }
  }
}

export function convertJsonDossierClientResult<
  TName extends DossierClientOperationName,
  TClient extends DossierClient<Entity<string, object>, Component<string, object>> = DossierClient,
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
    case DossierClientOperationName.acquireAdvisoryLock: {
      const result: MethodReturnTypeWithoutPromise<
        typeof DossierClientOperationName.acquireAdvisoryLock
      > = ok(value as AdvisoryLockPayload);
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.archiveEntity: {
      const result: MethodReturnTypeWithoutPromise<
        typeof DossierClientOperationName.archiveEntity
      > = ok(
        convertJsonPublishingResult(value as JsonPublishingResult<EntityArchivePayload['effect']>),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.createEntity: {
      const valueTyped = value as JsonEntityCreatePayload;
      const result: MethodReturnTypeWithoutPromise<typeof DossierClientOperationName.createEntity> =
        ok({
          ...valueTyped,
          entity: convertJsonEntity(valueTyped.entity),
        });
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.getChangelogEvents: {
      const result: MethodReturnTypeWithoutPromise<
        typeof DossierClientOperationName.getChangelogEvents
      > = ok(
        convertJsonConnection(
          value as JsonConnection<JsonEdge<JsonChangelogEvent, typeof ErrorType.Generic>> | null,
          convertJsonChangelogEventEdge,
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.getChangelogEventsTotalCount: {
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.getEntities: {
      const result: MethodReturnTypeWithoutPromise<typeof DossierClientOperationName.getEntities> =
        ok(
          convertJsonConnection(
            value as JsonConnection<JsonEdge<JsonEntity, ErrorType>> | null,
            convertJsonEntityEdge,
          ),
        );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.getEntitiesSample: {
      const payload = value as EntitySamplingPayload<JsonEntity>;
      const result: MethodReturnTypeWithoutPromise<
        typeof DossierClientOperationName.getEntitiesSample
      > = ok({
        ...payload,
        items: payload.items.map((it) => convertJsonEntity(it)),
      });
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.getEntitiesTotalCount:
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;

    case DossierClientOperationName.getEntity: {
      const result: MethodReturnTypeWithoutPromise<typeof DossierClientOperationName.getEntity> =
        ok(convertJsonEntity(value as JsonEntity));
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.getEntityList: {
      const result: MethodReturnTypeWithoutPromise<
        typeof DossierClientOperationName.getEntityList
      > = ok(
        (value as JsonResult<JsonEntity, typeof ErrorType.NotFound>[]).map((jsonItemResult) => {
          const itemResult = convertJsonResult(jsonItemResult);
          return itemResult.isOk() ? itemResult.map(convertJsonEntity) : itemResult;
        }),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.getSchemaSpecification:
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;
    case DossierClientOperationName.processDirtyEntity: {
      const result: MethodReturnTypeWithoutPromise<
        typeof DossierClientOperationName.processDirtyEntity
      > = ok(value as EntityProcessDirtyPayload);
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.publishEntities: {
      const result: MethodReturnTypeWithoutPromise<
        typeof DossierClientOperationName.publishEntities
      > = ok(
        (value as JsonPublishingResult<EntityPublishPayload['effect']>[]).map(
          convertJsonPublishingResult,
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.releaseAdvisoryLock: {
      const result: MethodReturnTypeWithoutPromise<
        typeof DossierClientOperationName.releaseAdvisoryLock
      > = ok(value as AdvisoryLockReleasePayload);
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.renewAdvisoryLock: {
      const result: MethodReturnTypeWithoutPromise<
        typeof DossierClientOperationName.renewAdvisoryLock
      > = ok(value as AdvisoryLockPayload);
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.unarchiveEntity: {
      const result: MethodReturnTypeWithoutPromise<
        typeof DossierClientOperationName.unarchiveEntity
      > = ok(
        convertJsonPublishingResult(
          value as JsonPublishingResult<EntityUnarchivePayload['effect']>,
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.unpublishEntities: {
      const result: MethodReturnTypeWithoutPromise<
        typeof DossierClientOperationName.unpublishEntities
      > = ok(
        (value as JsonPublishingResult<EntityUnpublishPayload['effect']>[]).map(
          convertJsonPublishingResult,
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.updateEntity: {
      const valueTyped = value as JsonEntityUpdatePayload;
      const result: MethodReturnTypeWithoutPromise<typeof DossierClientOperationName.updateEntity> =
        ok({
          ...valueTyped,
          entity: convertJsonEntity(valueTyped.entity),
        });
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case DossierClientOperationName.updateSchemaSpecification:
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;
    case DossierClientOperationName.upsertEntity: {
      const valueTyped = value as JsonEntityUpsertPayload;
      const result: MethodReturnTypeWithoutPromise<typeof DossierClientOperationName.upsertEntity> =
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

function convertJsonEntityEdge(edge: JsonEdge<JsonEntity, ErrorType>) {
  return convertJsonEdge(edge, convertJsonEntity);
}
