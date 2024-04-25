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
  Component,
  Connection,
  Edge,
  EntityReference,
  EntitySamplingOptions,
  EntitySamplingPayload,
  Paging,
  PublishedEntity,
  PublishedEntityQuery,
  PublishedEntitySharedQuery,
  UniqueIndexReference,
} from '../Types.js';
import type { PublishedSchemaSpecification } from '../schema/SchemaSpecification.js';
import type { LooseAutocomplete } from '../utils/TypeUtils.js';
import {
  convertJsonConnection,
  convertJsonEdge,
  convertJsonPublishedEntity,
  convertJsonResult,
  type JsonConnection,
  type JsonEdge,
  type JsonPublishedEntity,
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

export interface PublishedDossierClient<
  TEntity extends PublishedEntity<string, object> = PublishedEntity,
  TComponent extends Component<string, object> = Component,
  TUniqueIndex extends string = string,
  TExceptionClient extends PublishedDossierExceptionClient<
    TEntity,
    TComponent,
    TUniqueIndex
  > = PublishedDossierExceptionClient<TEntity, TComponent, TUniqueIndex>,
> {
  getSchemaSpecification(): PromiseResult<PublishedSchemaSpecification, typeof ErrorType.Generic>;

  getEntity(
    reference: EntityReference | UniqueIndexReference<TUniqueIndex>,
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
    query?: PublishedEntityQuery<
      TEntity['info']['type'],
      TComponent['type'],
      TEntity['info']['authKey']
    >,
    paging?: Paging,
  ): PromiseResult<
    Connection<Edge<TEntity, ErrorType>> | null,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  getEntitiesTotalCount(
    query?: PublishedEntitySharedQuery<
      TEntity['info']['type'],
      TComponent['type'],
      TEntity['info']['authKey']
    >,
  ): PromiseResult<
    number,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  getEntitiesSample(
    query?: PublishedEntitySharedQuery<
      TEntity['info']['type'],
      TComponent['type'],
      TEntity['info']['authKey']
    >,
    options?: EntitySamplingOptions,
  ): PromiseResult<
    EntitySamplingPayload<TEntity>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  toExceptionClient(): TExceptionClient;
}

export interface PublishedDossierExceptionClient<
  TPublishedEntity extends PublishedEntity<string, object> = PublishedEntity,
  TPublishedComponent extends Component<string, object> = Component,
  TUniqueIndex extends string = string,
> {
  client: Readonly<PublishedDossierClient<TPublishedEntity, TPublishedComponent, TUniqueIndex>>;

  getSchemaSpecification(): Promise<PublishedSchemaSpecification>;

  getEntity(
    reference: EntityReference | UniqueIndexReference<TUniqueIndex>,
  ): Promise<TPublishedEntity>;

  getEntityList(
    references: EntityReference[],
  ): Promise<
    Result<
      TPublishedEntity,
      | typeof ErrorType.BadRequest
      | typeof ErrorType.NotFound
      | typeof ErrorType.NotAuthorized
      | typeof ErrorType.Generic
    >[]
  >;

  getEntities(
    query?: PublishedEntityQuery<
      TPublishedEntity['info']['type'],
      TPublishedComponent['type'],
      TPublishedEntity['info']['authKey']
    >,
    paging?: Paging,
  ): Promise<Connection<Edge<TPublishedEntity, ErrorType>> | null>;

  getEntitiesTotalCount(
    query?: PublishedEntitySharedQuery<
      TPublishedEntity['info']['type'],
      TPublishedComponent['type'],
      TPublishedEntity['info']['authKey']
    >,
  ): Promise<number>;

  getEntitiesSample(
    query?: PublishedEntitySharedQuery<
      TPublishedEntity['info']['type'],
      TPublishedComponent['type'],
      TPublishedEntity['info']['authKey']
    >,
    options?: EntitySamplingOptions,
  ): Promise<EntitySamplingPayload<TPublishedEntity>>;
}

export const PublishedDossierClientOperationName = {
  getEntities: 'getEntities',
  getEntitiesSample: 'getEntitiesSample',
  getEntitiesTotalCount: 'getEntitiesTotalCount',
  getEntity: 'getEntity',
  getEntityList: 'getEntityList',
  getSchemaSpecification: 'getSchemaSpecification',
} as const;
type PublishedDossierClientOperationName = keyof typeof PublishedDossierClientOperationName;

type MethodParameters<
  TName extends keyof PublishedDossierClient,
  TClient extends PublishedDossierClient<
    PublishedEntity<string, object>,
    Component<string, object>
  > = PublishedDossierClient,
> = Parameters<TClient[TName]>;
type MethodReturnType<T extends keyof PublishedDossierClient> = Awaited<
  ReturnType<PublishedDossierClient[T]>
>;
type MethodReturnTypeWithoutPromise<
  TName extends keyof PublishedDossierClient,
  TClient extends PublishedDossierClient<
    PublishedEntity<string, object>,
    Component<string, object>
  > = PublishedDossierClient,
> = Awaited<
  PromiseResult<MethodReturnTypeOk<TName, TClient>, MethodReturnTypeError<TName, TClient>>
>;
type MethodReturnTypeOk<
  TName extends keyof PublishedDossierClient,
  TClient extends PublishedDossierClient<
    PublishedEntity<string, object>,
    Component<string, object>
  > = PublishedDossierClient,
> = OkFromResult<ReturnType<TClient[TName]>>;
type MethodReturnTypeError<
  TName extends keyof PublishedDossierClient,
  TClient extends PublishedDossierClient<
    PublishedEntity<string, object>,
    Component<string, object>
  > = PublishedDossierClient,
> = ErrorFromResult<ReturnType<TClient[TName]>>;

interface PublishedDossierClientOperationArguments {
  [PublishedDossierClientOperationName.getEntities]: MethodParameters<'getEntities'>;
  [PublishedDossierClientOperationName.getEntitiesSample]: MethodParameters<'getEntitiesSample'>;
  [PublishedDossierClientOperationName.getEntitiesTotalCount]: MethodParameters<'getEntitiesTotalCount'>;
  [PublishedDossierClientOperationName.getEntity]: MethodParameters<'getEntity'>;
  [PublishedDossierClientOperationName.getEntityList]: MethodParameters<'getEntityList'>;
  [PublishedDossierClientOperationName.getSchemaSpecification]: MethodParameters<'getSchemaSpecification'>;
}

interface PublishedDossierClientOperationReturn {
  [PublishedDossierClientOperationName.getEntities]: MethodReturnType<'getEntities'>;
  [PublishedDossierClientOperationName.getEntitiesSample]: MethodReturnType<'getEntitiesSample'>;
  [PublishedDossierClientOperationName.getEntitiesTotalCount]: MethodReturnType<'getEntitiesTotalCount'>;
  [PublishedDossierClientOperationName.getEntity]: MethodReturnType<'getEntity'>;
  [PublishedDossierClientOperationName.getEntityList]: MethodReturnType<'getEntityList'>;
  [PublishedDossierClientOperationName.getSchemaSpecification]: MethodReturnType<'getSchemaSpecification'>;
}

interface PublishedDossierClientOperationReturnOk {
  [PublishedDossierClientOperationName.getEntities]: MethodReturnTypeOk<'getEntities'>;
  [PublishedDossierClientOperationName.getEntitiesSample]: MethodReturnTypeOk<'getEntitiesSample'>;
  [PublishedDossierClientOperationName.getEntitiesTotalCount]: MethodReturnTypeOk<'getEntitiesTotalCount'>;
  [PublishedDossierClientOperationName.getEntity]: MethodReturnTypeOk<'getEntity'>;
  [PublishedDossierClientOperationName.getEntityList]: MethodReturnTypeOk<'getEntityList'>;
  [PublishedDossierClientOperationName.getSchemaSpecification]: MethodReturnTypeOk<'getSchemaSpecification'>;
}

interface PublishedDossierClientOperationReturnError {
  [PublishedDossierClientOperationName.getEntities]: MethodReturnTypeError<'getEntities'>;
  [PublishedDossierClientOperationName.getEntitiesSample]: MethodReturnTypeError<'getEntitiesSample'>;
  [PublishedDossierClientOperationName.getEntitiesTotalCount]: MethodReturnTypeError<'getEntitiesTotalCount'>;
  [PublishedDossierClientOperationName.getEntity]: MethodReturnTypeError<'getEntity'>;
  [PublishedDossierClientOperationName.getEntityList]: MethodReturnTypeError<'getEntityList'>;
  [PublishedDossierClientOperationName.getSchemaSpecification]: MethodReturnTypeError<'getSchemaSpecification'>;
}

export type PublishedDossierClientOperation<
  TName extends PublishedDossierClientOperationName = PublishedDossierClientOperationName,
> = Operation<
  TName,
  PublishedDossierClientOperationArguments[TName],
  PublishedDossierClientOperationReturnOk[TName],
  PublishedDossierClientOperationReturnError[TName],
  false
>;

export type PublishedDossierClientMiddleware<TContext extends ClientContext> = Middleware<
  TContext,
  PublishedDossierClientOperation
>;

export type PublishedDossierClientJsonOperationArgs<
  TName extends PublishedDossierClientOperationName = PublishedDossierClientOperationName,
> = PublishedDossierClientOperationArguments[TName];

class BasePublishedDossierClient<TContext extends ClientContext> implements PublishedDossierClient {
  private readonly context: TContext | ContextProvider<TContext>;
  private readonly pipeline: PublishedDossierClientMiddleware<TContext>[];

  constructor({
    context,
    pipeline,
  }: {
    context: TContext | ContextProvider<TContext>;
    pipeline: PublishedDossierClientMiddleware<TContext>[];
  }) {
    this.context = context;
    this.pipeline = pipeline;
  }

  getSchemaSpecification(): Promise<
    PublishedDossierClientOperationReturn[typeof PublishedDossierClientOperationName.getSchemaSpecification]
  > {
    return this.executeOperation({
      name: PublishedDossierClientOperationName.getSchemaSpecification,
      args: [],
      modifies: false,
    });
  }

  getEntity(
    reference: EntityReference,
  ): Promise<
    PublishedDossierClientOperationReturn[typeof PublishedDossierClientOperationName.getEntity]
  > {
    return this.executeOperation({
      name: PublishedDossierClientOperationName.getEntity,
      args: [reference],
      modifies: false,
    });
  }

  getEntityList(
    references: EntityReference[],
  ): Promise<
    PublishedDossierClientOperationReturn[typeof PublishedDossierClientOperationName.getEntityList]
  > {
    return this.executeOperation({
      name: PublishedDossierClientOperationName.getEntityList,
      args: [references],
      modifies: false,
    });
  }

  getEntities(
    query?: PublishedEntityQuery,
    paging?: Paging,
  ): Promise<
    PublishedDossierClientOperationReturn[typeof PublishedDossierClientOperationName.getEntities]
  > {
    return this.executeOperation({
      name: PublishedDossierClientOperationName.getEntities,
      args: [query, paging],
      modifies: false,
    });
  }

  getEntitiesTotalCount(
    query?: PublishedEntitySharedQuery,
  ): Promise<
    PublishedDossierClientOperationReturn[typeof PublishedDossierClientOperationName.getEntitiesTotalCount]
  > {
    return this.executeOperation({
      name: PublishedDossierClientOperationName.getEntitiesTotalCount,
      args: [query],
      modifies: false,
    });
  }

  getEntitiesSample(
    query?: PublishedEntitySharedQuery,
    options?: EntitySamplingOptions,
  ): PromiseResult<
    EntitySamplingPayload<PublishedEntity>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  > {
    return this.executeOperation({
      name: PublishedDossierClientOperationName.getEntitiesSample,
      args: [query, options],
      modifies: false,
    });
  }

  toExceptionClient(): PublishedDossierExceptionClient {
    return new PublishedExceptionClientWrapper(this);
  }

  private async executeOperation<TName extends PublishedDossierClientOperationName>(
    operation: OperationWithoutCallbacks<PublishedDossierClientOperation<TName>>,
  ): PromiseResult<
    PublishedDossierClientOperationReturnOk[TName],
    PublishedDossierClientOperationReturnError[TName]
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

class PublishedExceptionClientWrapper implements PublishedDossierExceptionClient {
  readonly client: PublishedDossierClient;

  constructor(client: PublishedDossierClient) {
    this.client = client;
  }

  async getSchemaSpecification(): Promise<PublishedSchemaSpecification> {
    return (await this.client.getSchemaSpecification()).valueOrThrow();
  }

  async getEntity(
    reference: EntityReference | UniqueIndexReference<string>,
  ): Promise<PublishedEntity<string, Record<string, unknown>, string>> {
    return (await this.client.getEntity(reference)).valueOrThrow();
  }

  async getEntityList(
    references: EntityReference[],
  ): Promise<
    Result<
      PublishedEntity<string, Record<string, unknown>, string>,
      'BadRequest' | 'NotAuthorized' | 'NotFound' | 'Generic'
    >[]
  > {
    return (await this.client.getEntityList(references)).valueOrThrow();
  }

  async getEntities(
    query?: PublishedEntityQuery<string> | undefined,
    paging?: Paging | undefined,
  ): Promise<Connection<
    Edge<PublishedEntity<string, Record<string, unknown>, string>, ErrorType>
  > | null> {
    return (await this.client.getEntities(query, paging)).valueOrThrow();
  }

  async getEntitiesTotalCount(
    query?: PublishedEntitySharedQuery<string, string> | undefined,
  ): Promise<number> {
    return (await this.client.getEntitiesTotalCount(query)).valueOrThrow();
  }

  async getEntitiesSample(
    query?: PublishedEntitySharedQuery<string, string> | undefined,
    options?: EntitySamplingOptions | undefined,
  ): Promise<EntitySamplingPayload<PublishedEntity<string, Record<string, unknown>, string>>> {
    return (await this.client.getEntitiesSample(query, options)).valueOrThrow();
  }
}

export function createBasePublishedDossierClient<
  TContext extends ClientContext,
  TClient extends PublishedDossierClient<
    PublishedEntity<string, object>,
    Component<string, object>
  > = PublishedDossierClient,
>(option: {
  context: TContext | ContextProvider<TContext>;
  pipeline: PublishedDossierClientMiddleware<TContext>[];
}): TClient {
  return new BasePublishedDossierClient(option) as unknown as TClient;
}

export async function executePublishedDossierClientOperationFromJson(
  publishedClient: PublishedDossierClient<
    PublishedEntity<string, object>,
    Component<string, object>
  >,
  operationName: LooseAutocomplete<PublishedDossierClientOperationName>,
  operationArgs: PublishedDossierClientJsonOperationArgs,
): PromiseResult<unknown, ErrorType> {
  const name = operationName as PublishedDossierClientOperationName;
  switch (name) {
    case PublishedDossierClientOperationName.getEntities: {
      const [query, paging] =
        operationArgs as PublishedDossierClientOperationArguments[typeof PublishedDossierClientOperationName.getEntities];
      return await publishedClient.getEntities(query, paging);
    }
    case PublishedDossierClientOperationName.getEntitiesSample: {
      const [query, options] =
        operationArgs as PublishedDossierClientOperationArguments[typeof PublishedDossierClientOperationName.getEntitiesSample];
      return await publishedClient.getEntitiesSample(query, options);
    }
    case PublishedDossierClientOperationName.getEntitiesTotalCount: {
      const [query] =
        operationArgs as PublishedDossierClientOperationArguments[typeof PublishedDossierClientOperationName.getEntitiesTotalCount];
      return await publishedClient.getEntitiesTotalCount(query);
    }
    case PublishedDossierClientOperationName.getEntity: {
      const [reference] =
        operationArgs as PublishedDossierClientOperationArguments[typeof PublishedDossierClientOperationName.getEntity];
      return await publishedClient.getEntity(reference);
    }
    case PublishedDossierClientOperationName.getEntityList: {
      const [references] =
        operationArgs as PublishedDossierClientOperationArguments[typeof PublishedDossierClientOperationName.getEntityList];
      return await publishedClient.getEntityList(references);
    }
    case PublishedDossierClientOperationName.getSchemaSpecification: {
      return await publishedClient.getSchemaSpecification();
    }
    default: {
      name satisfies never;
      return notOk.BadRequest(`Unknown operation ${operationName}`);
    }
  }
}

export function convertJsonPublishedDossierClientResult<
  TName extends PublishedDossierClientOperationName,
  TClient extends PublishedDossierClient<
    PublishedEntity<string, object>,
    Component<string, object>
  > = PublishedDossierClient,
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
    case PublishedDossierClientOperationName.getEntities: {
      const result: MethodReturnTypeWithoutPromise<'getEntities'> = ok(
        convertJsonConnection(
          value as JsonConnection<JsonEdge<JsonPublishedEntity, ErrorType>> | null,
          convertJsonPublishedEntityEdge,
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case PublishedDossierClientOperationName.getEntitiesSample: {
      const payload = value as EntitySamplingPayload<JsonPublishedEntity>;
      const result: MethodReturnTypeWithoutPromise<'getEntitiesSample'> = ok({
        ...payload,
        items: payload.items.map(convertJsonPublishedEntity),
      });
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case PublishedDossierClientOperationName.getEntitiesTotalCount:
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;
    case PublishedDossierClientOperationName.getEntity: {
      const result: MethodReturnTypeWithoutPromise<'getEntity'> = ok(
        convertJsonPublishedEntity(value as JsonPublishedEntity),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case PublishedDossierClientOperationName.getEntityList: {
      const result: MethodReturnTypeWithoutPromise<'getEntityList'> = ok(
        (value as JsonResult<JsonPublishedEntity, typeof ErrorType.NotFound>[]).map(
          (jsonItemResult) => {
            const itemResult = convertJsonResult(jsonItemResult);
            return itemResult.isOk() ? itemResult.map(convertJsonPublishedEntity) : itemResult;
          },
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }

    case PublishedDossierClientOperationName.getSchemaSpecification:
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;
    default: {
      operationName satisfies never;
      return notOk.Generic(`Unknown operation ${operationName}`) as MethodReturnTypeWithoutPromise<
        TName,
        TClient
      >;
    }
  }
}

function convertJsonPublishedEntityEdge(edge: JsonEdge<JsonPublishedEntity, ErrorType>) {
  return convertJsonEdge(edge, convertJsonPublishedEntity);
}
