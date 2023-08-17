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
  AdminEntity,
  AdminEntityArchivePayload,
  AdminEntityCreate,
  AdminEntityCreatePayload,
  AdminEntityMutationOptions,
  AdminEntityPublishPayload,
  AdminEntityUnarchivePayload,
  AdminEntityUnpublishPayload,
  AdminEntityUpdate,
  AdminEntityUpdatePayload,
  AdminEntityUpsert,
  AdminEntityUpsertPayload,
  AdminQuery,
  AdminSearchQuery,
  AdvisoryLockOptions,
  AdvisoryLockPayload,
  AdvisoryLockReleasePayload,
  Connection,
  Edge,
  EntityHistory,
  EntityReference,
  EntitySamplingOptions,
  EntitySamplingPayload,
  EntityVersionReference,
  Paging,
  PublishingHistory,
  UniqueIndexReference,
  ValueItem,
} from '../Types.js';
import type { ChangelogEvent, ChangelogQuery } from '../events/EventTypes.js';
import type {
  AdminSchemaSpecification,
  AdminSchemaSpecificationUpdate,
  AdminSchemaSpecificationWithMigrations,
  SchemaSpecificationUpdatePayload,
} from '../schema/SchemaSpecification.js';
import type { LooseAutocomplete } from '../utils/TypeUtils.js';
import {
  convertJsonAdminEntity,
  convertJsonChangelogEventEdge,
  convertJsonConnection,
  convertJsonEdge,
  convertJsonEntityHistory,
  convertJsonPublishingHistory,
  convertJsonPublishingResult,
  convertJsonResult,
  type JsonAdminEntity,
  type JsonAdminEntityCreatePayload,
  type JsonAdminEntityUpdatePayload,
  type JsonAdminEntityUpsertPayload,
  type JsonChangelogEvent,
  type JsonConnection,
  type JsonEdge,
  type JsonEntityHistory,
  type JsonPublishingHistory,
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
  TAdminEntity extends AdminEntity<string, object> = AdminEntity,
  TAdminValueItem extends ValueItem<string, object> = ValueItem,
  TUniqueIndex extends string = string,
  TExceptionClient extends AdminExceptionClient<
    TAdminEntity,
    TAdminValueItem,
    TUniqueIndex
  > = AdminExceptionClient<TAdminEntity, TAdminValueItem, TUniqueIndex>,
> {
  getSchemaSpecification(options: {
    includeMigrations: true;
  }): PromiseResult<AdminSchemaSpecificationWithMigrations, typeof ErrorType.Generic>;
  getSchemaSpecification(options?: {
    includeMigrations: boolean;
  }): PromiseResult<AdminSchemaSpecification, typeof ErrorType.Generic>;

  updateSchemaSpecification(
    schemaSpec: AdminSchemaSpecificationUpdate,
    options: { includeMigrations: true },
  ): PromiseResult<
    SchemaSpecificationUpdatePayload<AdminSchemaSpecificationWithMigrations>,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;
  updateSchemaSpecification(
    schemaSpec: AdminSchemaSpecificationUpdate,
    options?: { includeMigrations: boolean },
  ): PromiseResult<
    SchemaSpecificationUpdatePayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  getEntity(
    reference: EntityReference | EntityVersionReference | UniqueIndexReference<TUniqueIndex>,
  ): PromiseResult<
    TAdminEntity,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  getEntities(
    references: EntityReference[],
  ): PromiseResult<
    Result<
      TAdminEntity,
      | typeof ErrorType.BadRequest
      | typeof ErrorType.NotFound
      | typeof ErrorType.NotAuthorized
      | typeof ErrorType.Generic
    >[],
    typeof ErrorType.Generic
  >;

  sampleEntities(
    query?: AdminQuery<
      TAdminEntity['info']['type'],
      TAdminValueItem['type'],
      TAdminEntity['info']['authKey']
    >,
    options?: EntitySamplingOptions,
  ): PromiseResult<
    EntitySamplingPayload<TAdminEntity>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  searchEntities(
    query?: AdminSearchQuery<
      TAdminEntity['info']['type'],
      TAdminValueItem['type'],
      TAdminEntity['info']['authKey']
    >,
    paging?: Paging,
  ): PromiseResult<
    Connection<Edge<TAdminEntity, ErrorType>> | null,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  getTotalCount(
    query?: AdminQuery<
      TAdminEntity['info']['type'],
      TAdminValueItem['type'],
      TAdminEntity['info']['authKey']
    >,
  ): PromiseResult<
    number,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  createEntity<T extends AdminEntity<string, object> = TAdminEntity>(
    entity: Readonly<AdminEntityCreate<T>>,
    options?: AdminEntityMutationOptions,
  ): PromiseResult<
    AdminEntityCreatePayload<T>,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.Conflict
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  updateEntity<T extends AdminEntity<string, object> = TAdminEntity>(
    entity: Readonly<AdminEntityUpdate<T>>,
    options?: AdminEntityMutationOptions,
  ): PromiseResult<
    AdminEntityUpdatePayload<T>,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  upsertEntity<T extends AdminEntity<string, object> = TAdminEntity>(
    entity: Readonly<AdminEntityUpsert<T>>,
    options?: AdminEntityMutationOptions,
  ): PromiseResult<
    AdminEntityUpsertPayload<T>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  getChangelogEvents(
    query?: ChangelogQuery,
    paging?: Paging,
  ): PromiseResult<
    Connection<Edge<ChangelogEvent, typeof ErrorType.Generic>> | null,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  getChangelogEventsTotalCount(
    query?: ChangelogQuery,
  ): PromiseResult<
    number,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  getEntityHistory(
    reference: EntityReference,
  ): PromiseResult<
    EntityHistory,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  publishEntities(
    references: EntityVersionReference[],
  ): PromiseResult<
    AdminEntityPublishPayload[],
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  unpublishEntities(
    references: EntityReference[],
  ): PromiseResult<
    AdminEntityUnpublishPayload[],
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  archiveEntity(
    reference: EntityReference,
  ): PromiseResult<
    AdminEntityArchivePayload,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  unarchiveEntity(
    reference: EntityReference,
  ): PromiseResult<
    AdminEntityUnarchivePayload,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  getPublishingHistory(
    reference: EntityReference,
  ): PromiseResult<
    PublishingHistory,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
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
  ): PromiseResult<AdvisoryLockPayload, typeof ErrorType.NotFound | typeof ErrorType.Generic>;

  releaseAdvisoryLock(
    name: string,
    handle: number,
  ): PromiseResult<
    AdvisoryLockReleasePayload,
    typeof ErrorType.NotFound | typeof ErrorType.Generic
  >;

  toExceptionClient(): TExceptionClient;
}

export interface AdminExceptionClient<
  TAdminEntity extends AdminEntity<string, object> = AdminEntity,
  TAdminValueItem extends ValueItem<string, object> = ValueItem,
  TUniqueIndex extends string = string,
> {
  client: Readonly<AdminClient<TAdminEntity, TAdminValueItem, TUniqueIndex>>;

  getSchemaSpecification(options: {
    includeMigrations: true;
  }): Promise<AdminSchemaSpecificationWithMigrations>;
  getSchemaSpecification(options?: {
    includeMigrations: boolean;
  }): Promise<AdminSchemaSpecification>;

  updateSchemaSpecification(
    schemaSpec: AdminSchemaSpecificationUpdate,
    options: { includeMigrations: true },
  ): Promise<SchemaSpecificationUpdatePayload<AdminSchemaSpecificationWithMigrations>>;
  updateSchemaSpecification(
    schemaSpec: AdminSchemaSpecificationUpdate,
    options?: { includeMigrations: boolean },
  ): Promise<SchemaSpecificationUpdatePayload>;

  getEntity(
    reference: EntityReference | EntityVersionReference | UniqueIndexReference<TUniqueIndex>,
  ): Promise<TAdminEntity>;

  getEntities(
    references: EntityReference[],
  ): Promise<
    Result<
      TAdminEntity,
      | typeof ErrorType.BadRequest
      | typeof ErrorType.NotFound
      | typeof ErrorType.NotAuthorized
      | typeof ErrorType.Generic
    >[]
  >;

  sampleEntities(
    query?: AdminQuery<
      TAdminEntity['info']['type'],
      TAdminValueItem['type'],
      TAdminEntity['info']['authKey']
    >,
    options?: EntitySamplingOptions,
  ): Promise<EntitySamplingPayload<TAdminEntity>>;

  searchEntities(
    query?: AdminSearchQuery<
      TAdminEntity['info']['type'],
      TAdminValueItem['type'],
      TAdminEntity['info']['authKey']
    >,
    paging?: Paging,
  ): Promise<Connection<Edge<TAdminEntity, ErrorType>> | null>;

  getTotalCount(
    query?: AdminQuery<
      TAdminEntity['info']['type'],
      TAdminValueItem['type'],
      TAdminEntity['info']['authKey']
    >,
  ): Promise<number>;

  createEntity<T extends AdminEntity<string, object> = TAdminEntity>(
    entity: AdminEntityCreate<T>,
    options?: AdminEntityMutationOptions,
  ): Promise<AdminEntityCreatePayload<T>>;

  updateEntity<T extends AdminEntity<string, object> = TAdminEntity>(
    entity: AdminEntityUpdate<T>,
    options?: AdminEntityMutationOptions,
  ): Promise<AdminEntityUpdatePayload<T>>;

  upsertEntity<T extends AdminEntity<string, object> = TAdminEntity>(
    entity: AdminEntityUpsert<T>,
    options?: AdminEntityMutationOptions,
  ): Promise<AdminEntityUpsertPayload<T>>;

  getChangelogEvents(
    query?: ChangelogQuery,
    paging?: Paging,
  ): Promise<Connection<Edge<ChangelogEvent, typeof ErrorType.Generic>> | null>;

  getChangelogEventsTotalCount(query?: ChangelogQuery): Promise<number>;

  getEntityHistory(reference: EntityReference): Promise<EntityHistory>;

  publishEntities(references: EntityVersionReference[]): Promise<AdminEntityPublishPayload[]>;

  unpublishEntities(references: EntityReference[]): Promise<AdminEntityUnpublishPayload[]>;

  archiveEntity(reference: EntityReference): Promise<AdminEntityArchivePayload>;

  unarchiveEntity(reference: EntityReference): Promise<AdminEntityUnarchivePayload>;

  getPublishingHistory(reference: EntityReference): Promise<PublishingHistory>;

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
  getEntity: 'getEntity',
  getEntityHistory: 'getEntityHistory',
  getPublishingHistory: 'getPublishingHistory',
  getSchemaSpecification: 'getSchemaSpecification',
  getTotalCount: 'getTotalCount',
  publishEntities: 'publishEntities',
  releaseAdvisoryLock: 'releaseAdvisoryLock',
  renewAdvisoryLock: 'renewAdvisoryLock',
  sampleEntities: 'sampleEntities',
  searchEntities: 'searchEntities',
  unarchiveEntity: 'unarchiveEntity',
  unpublishEntities: 'unpublishEntities',
  updateEntity: 'updateEntity',
  updateSchemaSpecification: 'updateSchemaSpecification',
  upsertEntity: 'upsertEntity',
} as const;
type AdminClientOperationName = keyof typeof AdminClientOperationName;

type MethodParameters<
  TName extends keyof AdminClient,
  TClient extends AdminClient<AdminEntity<string, object>, ValueItem<string, object>> = AdminClient,
> = Parameters<TClient[TName]>;
type MethodReturnType<TName extends keyof AdminClient> = PromiseResult<
  MethodReturnTypeOk<TName>,
  MethodReturnTypeError<TName>
>;
type MethodReturnTypeWithoutPromise<
  TName extends keyof AdminClient,
  TClient extends AdminClient<AdminEntity<string, object>, ValueItem<string, object>> = AdminClient,
> = Awaited<
  PromiseResult<MethodReturnTypeOk<TName, TClient>, MethodReturnTypeError<TName, TClient>>
>;
type MethodReturnTypeOk<
  TName extends keyof AdminClient,
  TClient extends AdminClient<AdminEntity<string, object>, ValueItem<string, object>> = AdminClient,
> = OkFromResult<ReturnType<TClient[TName]>>;
type MethodReturnTypeError<
  TName extends keyof AdminClient,
  TClient extends AdminClient<AdminEntity<string, object>, ValueItem<string, object>> = AdminClient,
> = ErrorFromResult<ReturnType<TClient[TName]>>;

interface AdminClientOperationArguments {
  [AdminClientOperationName.acquireAdvisoryLock]: MethodParameters<'acquireAdvisoryLock'>;
  [AdminClientOperationName.archiveEntity]: MethodParameters<'archiveEntity'>;
  [AdminClientOperationName.createEntity]: MethodParameters<'createEntity'>;
  [AdminClientOperationName.getChangelogEvents]: MethodParameters<'getChangelogEvents'>;
  [AdminClientOperationName.getChangelogEventsTotalCount]: MethodParameters<'getChangelogEventsTotalCount'>;
  [AdminClientOperationName.getEntities]: MethodParameters<'getEntities'>;
  [AdminClientOperationName.getEntity]: MethodParameters<'getEntity'>;
  [AdminClientOperationName.getEntityHistory]: MethodParameters<'getEntityHistory'>;
  [AdminClientOperationName.getPublishingHistory]: MethodParameters<'getPublishingHistory'>;
  [AdminClientOperationName.getSchemaSpecification]: MethodParameters<'getSchemaSpecification'>;
  [AdminClientOperationName.getTotalCount]: MethodParameters<'getTotalCount'>;
  [AdminClientOperationName.publishEntities]: MethodParameters<'publishEntities'>;
  [AdminClientOperationName.releaseAdvisoryLock]: MethodParameters<'releaseAdvisoryLock'>;
  [AdminClientOperationName.renewAdvisoryLock]: MethodParameters<'renewAdvisoryLock'>;
  [AdminClientOperationName.sampleEntities]: MethodParameters<'sampleEntities'>;
  [AdminClientOperationName.searchEntities]: MethodParameters<'searchEntities'>;
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
  [AdminClientOperationName.getEntity]: MethodReturnTypeOk<'getEntity'>;
  [AdminClientOperationName.getEntityHistory]: MethodReturnTypeOk<'getEntityHistory'>;
  [AdminClientOperationName.getPublishingHistory]: MethodReturnTypeOk<'getPublishingHistory'>;
  [AdminClientOperationName.getSchemaSpecification]: MethodReturnTypeOk<'getSchemaSpecification'>;
  [AdminClientOperationName.getTotalCount]: MethodReturnTypeOk<'getTotalCount'>;
  [AdminClientOperationName.publishEntities]: MethodReturnTypeOk<'publishEntities'>;
  [AdminClientOperationName.releaseAdvisoryLock]: MethodReturnTypeOk<'releaseAdvisoryLock'>;
  [AdminClientOperationName.renewAdvisoryLock]: MethodReturnTypeOk<'renewAdvisoryLock'>;
  [AdminClientOperationName.sampleEntities]: MethodReturnTypeOk<'sampleEntities'>;
  [AdminClientOperationName.searchEntities]: MethodReturnTypeOk<'searchEntities'>;
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
  [AdminClientOperationName.getEntity]: MethodReturnTypeError<'getEntity'>;
  [AdminClientOperationName.getEntityHistory]: MethodReturnTypeError<'getEntityHistory'>;
  [AdminClientOperationName.getPublishingHistory]: MethodReturnTypeError<'getPublishingHistory'>;
  [AdminClientOperationName.getSchemaSpecification]: MethodReturnTypeError<'getSchemaSpecification'>;
  [AdminClientOperationName.getTotalCount]: MethodReturnTypeError<'getTotalCount'>;
  [AdminClientOperationName.publishEntities]: MethodReturnTypeError<'publishEntities'>;
  [AdminClientOperationName.releaseAdvisoryLock]: MethodReturnTypeError<'releaseAdvisoryLock'>;
  [AdminClientOperationName.renewAdvisoryLock]: MethodReturnTypeError<'renewAdvisoryLock'>;
  [AdminClientOperationName.sampleEntities]: MethodReturnTypeError<'sampleEntities'>;
  [AdminClientOperationName.searchEntities]: MethodReturnTypeError<'searchEntities'>;
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

export const AdminClientModifyingOperations: Readonly<Set<string>> = new Set([
  AdminClientOperationName.acquireAdvisoryLock,
  AdminClientOperationName.archiveEntity,
  AdminClientOperationName.createEntity,
  AdminClientOperationName.publishEntities,
  AdminClientOperationName.releaseAdvisoryLock,
  AdminClientOperationName.renewAdvisoryLock,
  AdminClientOperationName.unarchiveEntity,
  AdminClientOperationName.unpublishEntities,
  AdminClientOperationName.updateEntity,
  AdminClientOperationName.updateSchemaSpecification,
  AdminClientOperationName.upsertEntity,
] satisfies AdminClientOperationName[]);

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
  }): PromiseResult<AdminSchemaSpecificationWithMigrations, typeof ErrorType.Generic>;
  getSchemaSpecification(options?: {
    includeMigrations: boolean;
  }): PromiseResult<AdminSchemaSpecification, typeof ErrorType.Generic> {
    return this.executeOperation({
      name: AdminClientOperationName.getSchemaSpecification,
      args: [options],
      modifies: false,
    });
  }

  updateSchemaSpecification(
    schemaSpec: AdminSchemaSpecificationUpdate,
    options: { includeMigrations: true },
  ): PromiseResult<
    SchemaSpecificationUpdatePayload<AdminSchemaSpecificationWithMigrations>,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;
  updateSchemaSpecification(
    schemaSpec: AdminSchemaSpecificationUpdate,
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

  getEntities(
    references: EntityReference[],
  ): MethodReturnType<typeof AdminClientOperationName.getEntities> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntities,
      args: [references],
      modifies: false,
    });
  }

  sampleEntities(
    query?: AdminQuery,
    options?: EntitySamplingOptions,
  ): PromiseResult<
    EntitySamplingPayload<AdminEntity>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  > {
    return this.executeOperation({
      name: AdminClientOperationName.sampleEntities,
      args: [query, options],
      modifies: false,
    });
  }

  searchEntities(
    query?: AdminSearchQuery,
    paging?: Paging,
  ): MethodReturnType<typeof AdminClientOperationName.searchEntities> {
    return this.executeOperation({
      name: AdminClientOperationName.searchEntities,
      args: [query, paging],
      modifies: false,
    });
  }

  getTotalCount(
    query?: AdminQuery,
  ): MethodReturnType<typeof AdminClientOperationName.getTotalCount> {
    return this.executeOperation({
      name: AdminClientOperationName.getTotalCount,
      args: [query],
      modifies: false,
    });
  }

  createEntity<T extends AdminEntity<string, object> = AdminEntity>(
    entity: AdminEntityCreate<T>,
    options: AdminEntityMutationOptions | undefined,
  ): PromiseResult<
    AdminEntityCreatePayload<T>,
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
      AdminEntityCreatePayload<T>,
      | typeof ErrorType.BadRequest
      | typeof ErrorType.Conflict
      | typeof ErrorType.NotAuthorized
      | typeof ErrorType.Generic
    >;
  }

  updateEntity<T extends AdminEntity<string, object> = AdminEntity>(
    entity: AdminEntityUpdate<T>,
    options: AdminEntityMutationOptions | undefined,
  ): PromiseResult<
    AdminEntityUpdatePayload<T>,
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
      AdminEntityUpdatePayload<T>,
      | typeof ErrorType.BadRequest
      | typeof ErrorType.NotFound
      | typeof ErrorType.NotAuthorized
      | typeof ErrorType.Generic
    >;
  }

  upsertEntity<T extends AdminEntity<string, object> = AdminEntity>(
    entity: AdminEntityUpsert<T>,
    options: AdminEntityMutationOptions | undefined,
  ): PromiseResult<
    AdminEntityUpsertPayload<T>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  > {
    return this.executeOperation({
      name: AdminClientOperationName.upsertEntity,
      args: [entity, options],
      modifies: true,
    }) as PromiseResult<
      AdminEntityUpsertPayload<T>,
      typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
    >;
  }

  getChangelogEvents(
    query?: ChangelogQuery,
    paging?: Paging,
  ): MethodReturnType<typeof AdminClientOperationName.getChangelogEvents> {
    return this.executeOperation({
      name: AdminClientOperationName.getChangelogEvents,
      args: [query, paging],
      modifies: false,
    });
  }

  getChangelogEventsTotalCount(
    query?: ChangelogQuery,
  ): MethodReturnType<typeof AdminClientOperationName.getChangelogEventsTotalCount> {
    return this.executeOperation({
      name: AdminClientOperationName.getChangelogEventsTotalCount,
      args: [query],
      modifies: false,
    });
  }

  getEntityHistory(
    reference: EntityReference,
  ): MethodReturnType<typeof AdminClientOperationName.getEntityHistory> {
    return this.executeOperation({
      name: AdminClientOperationName.getEntityHistory,
      args: [reference],
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

  getPublishingHistory(
    reference: EntityReference,
  ): MethodReturnType<typeof AdminClientOperationName.getPublishingHistory> {
    return this.executeOperation({
      name: AdminClientOperationName.getPublishingHistory,
      args: [reference],
      modifies: false,
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
  ): PromiseResult<AdvisoryLockPayload, typeof ErrorType.NotFound | typeof ErrorType.Generic> {
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
    typeof ErrorType.NotFound | typeof ErrorType.Generic
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
  }): Promise<AdminSchemaSpecificationWithMigrations>;
  async getSchemaSpecification(options?: {
    includeMigrations: boolean;
  }): Promise<AdminSchemaSpecification> {
    return (await this.client.getSchemaSpecification(options)).valueOrThrow();
  }

  async updateSchemaSpecification(
    schemaSpec: AdminSchemaSpecificationUpdate,
    options: { includeMigrations: true },
  ): Promise<SchemaSpecificationUpdatePayload<AdminSchemaSpecificationWithMigrations>>;
  async updateSchemaSpecification(
    schemaSpec: AdminSchemaSpecificationUpdate,
    options?: { includeMigrations: boolean },
  ): Promise<SchemaSpecificationUpdatePayload> {
    return (await this.client.updateSchemaSpecification(schemaSpec, options)).valueOrThrow();
  }

  async getEntity(
    reference: EntityReference | EntityVersionReference | UniqueIndexReference<string>,
  ): Promise<AdminEntity<string, Record<string, unknown>, string>> {
    return (await this.client.getEntity(reference)).valueOrThrow();
  }

  async getEntities(
    references: EntityReference[],
  ): Promise<
    Result<
      AdminEntity<string, Record<string, unknown>, string>,
      'BadRequest' | 'NotAuthorized' | 'NotFound' | 'Generic'
    >[]
  > {
    return (await this.client.getEntities(references)).valueOrThrow();
  }

  async sampleEntities(
    query?: AdminQuery<string, string> | undefined,
    options?: EntitySamplingOptions | undefined,
  ): Promise<EntitySamplingPayload<AdminEntity<string, Record<string, unknown>, string>>> {
    return (await this.client.sampleEntities(query, options)).valueOrThrow();
  }

  async searchEntities(
    query?: AdminSearchQuery<string, string> | undefined,
    paging?: Paging | undefined,
  ): Promise<Connection<
    Edge<AdminEntity<string, Record<string, unknown>, string>, ErrorType>
  > | null> {
    return (await this.client.searchEntities(query, paging)).valueOrThrow();
  }

  async getTotalCount(query?: AdminQuery<string, string> | undefined): Promise<number> {
    return (await this.client.getTotalCount(query)).valueOrThrow();
  }

  async createEntity<
    T extends AdminEntity<string, object, string> = AdminEntity<
      string,
      Record<string, unknown>,
      string
    >,
  >(
    entity: AdminEntityCreate<T>,
    options?: AdminEntityMutationOptions | undefined,
  ): Promise<AdminEntityCreatePayload<T>> {
    return (await this.client.createEntity(entity, options)).valueOrThrow();
  }

  async updateEntity<
    T extends AdminEntity<string, object, string> = AdminEntity<
      string,
      Record<string, unknown>,
      string
    >,
  >(
    entity: AdminEntityUpdate<T>,
    options?: AdminEntityMutationOptions | undefined,
  ): Promise<AdminEntityUpdatePayload<T>> {
    return (await this.client.updateEntity(entity, options)).valueOrThrow();
  }

  async upsertEntity<
    T extends AdminEntity<string, object, string> = AdminEntity<
      string,
      Record<string, unknown>,
      string
    >,
  >(
    entity: AdminEntityUpsert<T>,
    options?: AdminEntityMutationOptions | undefined,
  ): Promise<AdminEntityUpsertPayload<T>> {
    return (await this.client.upsertEntity(entity, options)).valueOrThrow();
  }

  async getChangelogEvents(
    query?: ChangelogQuery,
    paging?: Paging,
  ): Promise<Connection<Edge<ChangelogEvent, typeof ErrorType.Generic>> | null> {
    return (await this.client.getChangelogEvents(query, paging)).valueOrThrow();
  }

  async getChangelogEventsTotalCount(query?: ChangelogQuery): Promise<number> {
    return (await this.client.getChangelogEventsTotalCount(query)).valueOrThrow();
  }

  async getEntityHistory(reference: EntityReference): Promise<EntityHistory> {
    return (await this.client.getEntityHistory(reference)).valueOrThrow();
  }

  async publishEntities(
    references: EntityVersionReference[],
  ): Promise<AdminEntityPublishPayload[]> {
    return (await this.client.publishEntities(references)).valueOrThrow();
  }

  async unpublishEntities(references: EntityReference[]): Promise<AdminEntityUnpublishPayload[]> {
    return (await this.client.unpublishEntities(references)).valueOrThrow();
  }

  async archiveEntity(reference: EntityReference): Promise<AdminEntityArchivePayload> {
    return (await this.client.archiveEntity(reference)).valueOrThrow();
  }

  async unarchiveEntity(reference: EntityReference): Promise<AdminEntityUnarchivePayload> {
    return (await this.client.unarchiveEntity(reference)).valueOrThrow();
  }

  async getPublishingHistory(reference: EntityReference): Promise<PublishingHistory> {
    return (await this.client.getPublishingHistory(reference)).valueOrThrow();
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
  TClient extends AdminClient<AdminEntity<string, object>, ValueItem<string, object>> = AdminClient,
>(option: {
  context: TContext | ContextProvider<TContext>;
  pipeline: AdminClientMiddleware<TContext>[];
}): TClient {
  return new BaseAdminClient(option) as unknown as TClient;
}

export async function executeAdminClientOperationFromJson(
  adminClient: AdminClient<AdminEntity<string, object>, ValueItem<string, object>>,
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
      const [references] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.getEntities];
      return await adminClient.getEntities(references);
    }
    case AdminClientOperationName.getEntity: {
      const [reference] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.getEntity];
      return await adminClient.getEntity(reference);
    }
    case AdminClientOperationName.getEntityHistory: {
      const [reference] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.getEntityHistory];
      return await adminClient.getEntityHistory(reference);
    }
    case AdminClientOperationName.getPublishingHistory: {
      const [reference] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.getPublishingHistory];
      return await adminClient.getPublishingHistory(reference);
    }
    case AdminClientOperationName.getSchemaSpecification: {
      const [options] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.getSchemaSpecification];
      return await adminClient.getSchemaSpecification(options);
    }
    case AdminClientOperationName.getTotalCount: {
      const [query] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.getTotalCount];
      return await adminClient.getTotalCount(query);
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
    case AdminClientOperationName.sampleEntities: {
      const [query, options] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.sampleEntities];
      return await adminClient.sampleEntities(query, options);
    }
    case AdminClientOperationName.searchEntities: {
      const [query, paging] =
        operationArgs as AdminClientOperationArguments[typeof AdminClientOperationName.searchEntities];
      return await adminClient.searchEntities(query, paging);
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
      const _never: never = name; // ensure exhaustiveness
      return notOk.BadRequest(`Unknown operation ${operationName}`);
    }
  }
}

export function convertJsonAdminClientResult<
  TName extends AdminClientOperationName,
  TClient extends AdminClient<AdminEntity<string, object>, ValueItem<string, object>> = AdminClient,
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
            value as JsonPublishingResult<AdminEntityArchivePayload['effect']>,
          ),
        );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.createEntity: {
      const valueTyped = value as JsonAdminEntityCreatePayload;
      const result: MethodReturnTypeWithoutPromise<typeof AdminClientOperationName.createEntity> =
        ok({
          ...valueTyped,
          entity: convertJsonAdminEntity(valueTyped.entity),
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
          (value as JsonResult<JsonAdminEntity, typeof ErrorType.NotFound>[]).map(
            (jsonItemResult) => {
              const itemResult = convertJsonResult(jsonItemResult);
              return itemResult.isOk() ? itemResult.map(convertJsonAdminEntity) : itemResult;
            },
          ),
        );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.getEntity: {
      const result: MethodReturnTypeWithoutPromise<typeof AdminClientOperationName.getEntity> = ok(
        convertJsonAdminEntity(value as JsonAdminEntity),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.getEntityHistory: {
      const result: MethodReturnTypeWithoutPromise<
        typeof AdminClientOperationName.getEntityHistory
      > = ok(convertJsonEntityHistory(value as JsonEntityHistory));
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.getPublishingHistory: {
      const result: MethodReturnTypeWithoutPromise<
        typeof AdminClientOperationName.getPublishingHistory
      > = ok(convertJsonPublishingHistory(value as JsonPublishingHistory));
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.getSchemaSpecification:
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;
    case AdminClientOperationName.publishEntities: {
      const result: MethodReturnTypeWithoutPromise<
        typeof AdminClientOperationName.publishEntities
      > = ok(
        (value as JsonPublishingResult<AdminEntityPublishPayload['effect']>[]).map(
          convertJsonPublishingResult,
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.getTotalCount:
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;
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
    case AdminClientOperationName.sampleEntities: {
      const payload = value as EntitySamplingPayload<JsonAdminEntity>;
      const result: MethodReturnTypeWithoutPromise<typeof AdminClientOperationName.sampleEntities> =
        ok({
          ...payload,
          items: payload.items.map((it) => convertJsonAdminEntity(it)),
        });
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.searchEntities: {
      const result: MethodReturnTypeWithoutPromise<typeof AdminClientOperationName.searchEntities> =
        ok(
          convertJsonConnection(
            value as JsonConnection<JsonEdge<JsonAdminEntity, ErrorType>> | null,
            convertJsonAdminEntityEdge,
          ),
        );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.unarchiveEntity: {
      const result: MethodReturnTypeWithoutPromise<
        typeof AdminClientOperationName.unarchiveEntity
      > = ok(
        convertJsonPublishingResult(
          value as JsonPublishingResult<AdminEntityUnarchivePayload['effect']>,
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.unpublishEntities: {
      const result: MethodReturnTypeWithoutPromise<
        typeof AdminClientOperationName.unpublishEntities
      > = ok(
        (value as JsonPublishingResult<AdminEntityUnpublishPayload['effect']>[]).map(
          convertJsonPublishingResult,
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.updateEntity: {
      const valueTyped = value as JsonAdminEntityUpdatePayload;
      const result: MethodReturnTypeWithoutPromise<typeof AdminClientOperationName.updateEntity> =
        ok({
          ...valueTyped,
          entity: convertJsonAdminEntity(valueTyped.entity),
        });
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case AdminClientOperationName.updateSchemaSpecification:
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;
    case AdminClientOperationName.upsertEntity: {
      const valueTyped = value as JsonAdminEntityUpsertPayload;
      const result: MethodReturnTypeWithoutPromise<typeof AdminClientOperationName.upsertEntity> =
        ok({
          ...valueTyped,
          entity: convertJsonAdminEntity(valueTyped.entity),
        });
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    default: {
      const _never: never = operationName; // ensure exhaustiveness
      return notOk.Generic(`Unknown operation ${operationName}`) as MethodReturnTypeWithoutPromise<
        TName,
        TClient
      >;
    }
  }
}

function convertJsonAdminEntityEdge(edge: JsonEdge<JsonAdminEntity, ErrorType>) {
  return convertJsonEdge(edge, convertJsonAdminEntity);
}
