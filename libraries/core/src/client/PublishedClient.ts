import type { ErrorFromResult, OkFromResult, PromiseResult, Result } from '../ErrorResult.js';
import { ErrorType, notOk, ok } from '../ErrorResult.js';
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
import type { JsonConnection, JsonEdge, JsonPublishedEntity, JsonResult } from './JsonUtils.js';
import {
  convertJsonConnection,
  convertJsonEdge,
  convertJsonPublishedEntity,
  convertJsonResult,
} from './JsonUtils.js';
import type {
  ClientContext,
  ContextProvider,
  Middleware,
  Operation,
  OperationWithoutCallbacks,
} from './SharedClient.js';
import { executeOperationPipeline } from './SharedClient.js';

export interface PublishedClient<
  TPublishedEntity extends PublishedEntity<string, object> = PublishedEntity,
  TPublishedComponent extends Component<string, object> = Component,
  TUniqueIndex extends string = string,
  TExceptionClient extends PublishedExceptionClient<
    TPublishedEntity,
    TPublishedComponent,
    TUniqueIndex
  > = PublishedExceptionClient<TPublishedEntity, TPublishedComponent, TUniqueIndex>,
> {
  getSchemaSpecification(): PromiseResult<PublishedSchemaSpecification, typeof ErrorType.Generic>;

  getEntity(
    reference: EntityReference | UniqueIndexReference<TUniqueIndex>,
  ): PromiseResult<
    TPublishedEntity,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  getEntityList(
    references: EntityReference[],
  ): PromiseResult<
    Result<
      TPublishedEntity,
      | typeof ErrorType.BadRequest
      | typeof ErrorType.NotFound
      | typeof ErrorType.NotAuthorized
      | typeof ErrorType.Generic
    >[],
    typeof ErrorType.Generic
  >;

  getEntities(
    query?: PublishedEntityQuery<
      TPublishedEntity['info']['type'],
      TPublishedComponent['type'],
      TPublishedEntity['info']['authKey']
    >,
    paging?: Paging,
  ): PromiseResult<
    Connection<Edge<TPublishedEntity, ErrorType>> | null,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  getEntitiesTotalCount(
    query?: PublishedEntitySharedQuery<
      TPublishedEntity['info']['type'],
      TPublishedComponent['type'],
      TPublishedEntity['info']['authKey']
    >,
  ): PromiseResult<
    number,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  getEntitiesSample(
    query?: PublishedEntitySharedQuery<
      TPublishedEntity['info']['type'],
      TPublishedComponent['type'],
      TPublishedEntity['info']['authKey']
    >,
    options?: EntitySamplingOptions,
  ): PromiseResult<
    EntitySamplingPayload<TPublishedEntity>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  toExceptionClient(): TExceptionClient;
}

export interface PublishedExceptionClient<
  TPublishedEntity extends PublishedEntity<string, object> = PublishedEntity,
  TPublishedComponent extends Component<string, object> = Component,
  TUniqueIndex extends string = string,
> {
  client: Readonly<PublishedClient<TPublishedEntity, TPublishedComponent, TUniqueIndex>>;

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

export const PublishedClientOperationName = {
  getEntities: 'getEntities',
  getEntitiesSample: 'getEntitiesSample',
  getEntitiesTotalCount: 'getEntitiesTotalCount',
  getEntity: 'getEntity',
  getEntityList: 'getEntityList',
  getSchemaSpecification: 'getSchemaSpecification',
} as const;
type PublishedClientOperationName = keyof typeof PublishedClientOperationName;

type MethodParameters<
  TName extends keyof PublishedClient,
  TClient extends PublishedClient<
    PublishedEntity<string, object>,
    Component<string, object>
  > = PublishedClient,
> = Parameters<TClient[TName]>;
type MethodReturnType<T extends keyof PublishedClient> = Awaited<ReturnType<PublishedClient[T]>>;
type MethodReturnTypeWithoutPromise<
  TName extends keyof PublishedClient,
  TClient extends PublishedClient<
    PublishedEntity<string, object>,
    Component<string, object>
  > = PublishedClient,
> = Awaited<
  PromiseResult<MethodReturnTypeOk<TName, TClient>, MethodReturnTypeError<TName, TClient>>
>;
type MethodReturnTypeOk<
  TName extends keyof PublishedClient,
  TClient extends PublishedClient<
    PublishedEntity<string, object>,
    Component<string, object>
  > = PublishedClient,
> = OkFromResult<ReturnType<TClient[TName]>>;
type MethodReturnTypeError<
  TName extends keyof PublishedClient,
  TClient extends PublishedClient<
    PublishedEntity<string, object>,
    Component<string, object>
  > = PublishedClient,
> = ErrorFromResult<ReturnType<TClient[TName]>>;

interface PublishedClientOperationArguments {
  [PublishedClientOperationName.getEntities]: MethodParameters<'getEntities'>;
  [PublishedClientOperationName.getEntitiesSample]: MethodParameters<'getEntitiesSample'>;
  [PublishedClientOperationName.getEntitiesTotalCount]: MethodParameters<'getEntitiesTotalCount'>;
  [PublishedClientOperationName.getEntity]: MethodParameters<'getEntity'>;
  [PublishedClientOperationName.getEntityList]: MethodParameters<'getEntityList'>;
  [PublishedClientOperationName.getSchemaSpecification]: MethodParameters<'getSchemaSpecification'>;
}

interface PublishedClientOperationReturn {
  [PublishedClientOperationName.getEntities]: MethodReturnType<'getEntities'>;
  [PublishedClientOperationName.getEntitiesSample]: MethodReturnType<'getEntitiesSample'>;
  [PublishedClientOperationName.getEntitiesTotalCount]: MethodReturnType<'getEntitiesTotalCount'>;
  [PublishedClientOperationName.getEntity]: MethodReturnType<'getEntity'>;
  [PublishedClientOperationName.getEntityList]: MethodReturnType<'getEntityList'>;
  [PublishedClientOperationName.getSchemaSpecification]: MethodReturnType<'getSchemaSpecification'>;
}

interface PublishedClientOperationReturnOk {
  [PublishedClientOperationName.getEntities]: MethodReturnTypeOk<'getEntities'>;
  [PublishedClientOperationName.getEntitiesSample]: MethodReturnTypeOk<'getEntitiesSample'>;
  [PublishedClientOperationName.getEntitiesTotalCount]: MethodReturnTypeOk<'getEntitiesTotalCount'>;
  [PublishedClientOperationName.getEntity]: MethodReturnTypeOk<'getEntity'>;
  [PublishedClientOperationName.getEntityList]: MethodReturnTypeOk<'getEntityList'>;
  [PublishedClientOperationName.getSchemaSpecification]: MethodReturnTypeOk<'getSchemaSpecification'>;
}

interface PublishedClientOperationReturnError {
  [PublishedClientOperationName.getEntities]: MethodReturnTypeError<'getEntities'>;
  [PublishedClientOperationName.getEntitiesSample]: MethodReturnTypeError<'getEntitiesSample'>;
  [PublishedClientOperationName.getEntitiesTotalCount]: MethodReturnTypeError<'getEntitiesTotalCount'>;
  [PublishedClientOperationName.getEntity]: MethodReturnTypeError<'getEntity'>;
  [PublishedClientOperationName.getEntityList]: MethodReturnTypeError<'getEntityList'>;
  [PublishedClientOperationName.getSchemaSpecification]: MethodReturnTypeError<'getSchemaSpecification'>;
}

export type PublishedClientOperation<
  TName extends PublishedClientOperationName = PublishedClientOperationName,
> = Operation<
  TName,
  PublishedClientOperationArguments[TName],
  PublishedClientOperationReturnOk[TName],
  PublishedClientOperationReturnError[TName],
  false
>;

export type PublishedClientMiddleware<TContext extends ClientContext> = Middleware<
  TContext,
  PublishedClientOperation
>;

export type PublishedClientJsonOperationArgs<
  TName extends PublishedClientOperationName = PublishedClientOperationName,
> = PublishedClientOperationArguments[TName];

class BasePublishedClient<TContext extends ClientContext> implements PublishedClient {
  private readonly context: TContext | ContextProvider<TContext>;
  private readonly pipeline: PublishedClientMiddleware<TContext>[];

  constructor({
    context,
    pipeline,
  }: {
    context: TContext | ContextProvider<TContext>;
    pipeline: PublishedClientMiddleware<TContext>[];
  }) {
    this.context = context;
    this.pipeline = pipeline;
  }

  getSchemaSpecification(): Promise<
    PublishedClientOperationReturn[typeof PublishedClientOperationName.getSchemaSpecification]
  > {
    return this.executeOperation({
      name: PublishedClientOperationName.getSchemaSpecification,
      args: [],
      modifies: false,
    });
  }

  getEntity(
    reference: EntityReference,
  ): Promise<PublishedClientOperationReturn[typeof PublishedClientOperationName.getEntity]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getEntity,
      args: [reference],
      modifies: false,
    });
  }

  getEntityList(
    references: EntityReference[],
  ): Promise<PublishedClientOperationReturn[typeof PublishedClientOperationName.getEntityList]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getEntityList,
      args: [references],
      modifies: false,
    });
  }

  getEntities(
    query?: PublishedEntityQuery,
    paging?: Paging,
  ): Promise<PublishedClientOperationReturn[typeof PublishedClientOperationName.getEntities]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getEntities,
      args: [query, paging],
      modifies: false,
    });
  }

  getEntitiesTotalCount(
    query?: PublishedEntitySharedQuery,
  ): Promise<
    PublishedClientOperationReturn[typeof PublishedClientOperationName.getEntitiesTotalCount]
  > {
    return this.executeOperation({
      name: PublishedClientOperationName.getEntitiesTotalCount,
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
      name: PublishedClientOperationName.getEntitiesSample,
      args: [query, options],
      modifies: false,
    });
  }

  toExceptionClient(): PublishedExceptionClient {
    return new PublishedExceptionClientWrapper(this);
  }

  private async executeOperation<TName extends PublishedClientOperationName>(
    operation: OperationWithoutCallbacks<PublishedClientOperation<TName>>,
  ): PromiseResult<
    PublishedClientOperationReturnOk[TName],
    PublishedClientOperationReturnError[TName]
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

class PublishedExceptionClientWrapper implements PublishedExceptionClient {
  readonly client: PublishedClient;

  constructor(client: PublishedClient) {
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

export function createBasePublishedClient<
  TContext extends ClientContext,
  TClient extends PublishedClient<
    PublishedEntity<string, object>,
    Component<string, object>
  > = PublishedClient,
>(option: {
  context: TContext | ContextProvider<TContext>;
  pipeline: PublishedClientMiddleware<TContext>[];
}): TClient {
  return new BasePublishedClient(option) as unknown as TClient;
}

export async function executePublishedClientOperationFromJson(
  publishedClient: PublishedClient<PublishedEntity<string, object>, Component<string, object>>,
  operationName: LooseAutocomplete<PublishedClientOperationName>,
  operationArgs: PublishedClientJsonOperationArgs,
): PromiseResult<unknown, ErrorType> {
  const name = operationName as PublishedClientOperationName;
  switch (name) {
    case PublishedClientOperationName.getEntities: {
      const [query, paging] =
        operationArgs as PublishedClientOperationArguments[typeof PublishedClientOperationName.getEntities];
      return await publishedClient.getEntities(query, paging);
    }
    case PublishedClientOperationName.getEntitiesSample: {
      const [query, options] =
        operationArgs as PublishedClientOperationArguments[typeof PublishedClientOperationName.getEntitiesSample];
      return await publishedClient.getEntitiesSample(query, options);
    }
    case PublishedClientOperationName.getEntitiesTotalCount: {
      const [query] =
        operationArgs as PublishedClientOperationArguments[typeof PublishedClientOperationName.getEntitiesTotalCount];
      return await publishedClient.getEntitiesTotalCount(query);
    }
    case PublishedClientOperationName.getEntity: {
      const [reference] =
        operationArgs as PublishedClientOperationArguments[typeof PublishedClientOperationName.getEntity];
      return await publishedClient.getEntity(reference);
    }
    case PublishedClientOperationName.getEntityList: {
      const [references] =
        operationArgs as PublishedClientOperationArguments[typeof PublishedClientOperationName.getEntityList];
      return await publishedClient.getEntityList(references);
    }
    case PublishedClientOperationName.getSchemaSpecification: {
      return await publishedClient.getSchemaSpecification();
    }
    default: {
      const _never: never = name; // ensure exhaustiveness
      return notOk.BadRequest(`Unknown operation ${operationName}`);
    }
  }
}

export function convertJsonPublishedClientResult<
  TName extends PublishedClientOperationName,
  TClient extends PublishedClient<
    PublishedEntity<string, object>,
    Component<string, object>
  > = PublishedClient,
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
    case PublishedClientOperationName.getEntities: {
      const result: MethodReturnTypeWithoutPromise<'getEntities'> = ok(
        convertJsonConnection(
          value as JsonConnection<JsonEdge<JsonPublishedEntity, ErrorType>> | null,
          convertJsonPublishedEntityEdge,
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case PublishedClientOperationName.getEntitiesSample: {
      const payload = value as EntitySamplingPayload<JsonPublishedEntity>;
      const result: MethodReturnTypeWithoutPromise<'getEntitiesSample'> = ok({
        ...payload,
        items: payload.items.map(convertJsonPublishedEntity),
      });
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case PublishedClientOperationName.getEntitiesTotalCount:
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;
    case PublishedClientOperationName.getEntity: {
      const result: MethodReturnTypeWithoutPromise<'getEntity'> = ok(
        convertJsonPublishedEntity(value as JsonPublishedEntity),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case PublishedClientOperationName.getEntityList: {
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

    case PublishedClientOperationName.getSchemaSpecification:
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
