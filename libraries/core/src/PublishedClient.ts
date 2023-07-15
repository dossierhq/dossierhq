import type { ErrorFromResult, OkFromResult, PromiseResult, Result } from './ErrorResult.js';
import { ErrorType, notOk, ok } from './ErrorResult.js';
import type { JsonConnection, JsonEdge, JsonPublishedEntity, JsonResult } from './JsonUtils.js';
import {
  convertJsonConnection,
  convertJsonEdge,
  convertJsonPublishedEntity,
  convertJsonResult,
} from './JsonUtils.js';
import type { PublishedSchemaSpecification } from './Schema.js';
import type {
  ClientContext,
  ContextProvider,
  Middleware,
  Operation,
  OperationWithoutCallbacks,
} from './SharedClient.js';
import { executeOperationPipeline } from './SharedClient.js';
import type { LooseAutocomplete } from './TypeUtils.js';
import type {
  Connection,
  Edge,
  EntityReference,
  EntitySamplingOptions,
  EntitySamplingPayload,
  Paging,
  PublishedEntity,
  PublishedQuery,
  PublishedSearchQuery,
  UniqueIndexReference,
  ValueItem,
} from './Types.js';

export interface PublishedClient<
  TPublishedEntity extends PublishedEntity<string, object> = PublishedEntity,
  TPublishedValueItem extends ValueItem<string, object> = ValueItem,
  TUniqueIndex extends string = string,
  TExceptionClient extends PublishedExceptionClient<
    TPublishedEntity,
    TPublishedValueItem,
    TUniqueIndex
  > = PublishedExceptionClient<TPublishedEntity, TPublishedValueItem, TUniqueIndex>,
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

  getEntities(
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

  sampleEntities(
    query?: PublishedQuery<
      TPublishedEntity['info']['type'],
      TPublishedValueItem['type'],
      TPublishedEntity['info']['authKey']
    >,
    options?: EntitySamplingOptions,
  ): PromiseResult<
    EntitySamplingPayload<TPublishedEntity>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  searchEntities(
    query?: PublishedSearchQuery<
      TPublishedEntity['info']['type'],
      TPublishedValueItem['type'],
      TPublishedEntity['info']['authKey']
    >,
    paging?: Paging,
  ): PromiseResult<
    Connection<Edge<TPublishedEntity, ErrorType>> | null,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  getTotalCount(
    query?: PublishedQuery<
      TPublishedEntity['info']['type'],
      TPublishedValueItem['type'],
      TPublishedEntity['info']['authKey']
    >,
  ): PromiseResult<
    number,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  toExceptionClient(): TExceptionClient;
}

export interface PublishedExceptionClient<
  TPublishedEntity extends PublishedEntity<string, object> = PublishedEntity,
  TPublishedValueItem extends ValueItem<string, object> = ValueItem,
  TUniqueIndex extends string = string,
> {
  client: Readonly<PublishedClient<TPublishedEntity, TPublishedValueItem, TUniqueIndex>>;

  getSchemaSpecification(): Promise<PublishedSchemaSpecification>;

  getEntity(
    reference: EntityReference | UniqueIndexReference<TUniqueIndex>,
  ): Promise<TPublishedEntity>;

  getEntities(
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

  sampleEntities(
    query?: PublishedQuery<
      TPublishedEntity['info']['type'],
      TPublishedValueItem['type'],
      TPublishedEntity['info']['authKey']
    >,
    options?: EntitySamplingOptions,
  ): Promise<EntitySamplingPayload<TPublishedEntity>>;

  searchEntities(
    query?: PublishedSearchQuery<
      TPublishedEntity['info']['type'],
      TPublishedValueItem['type'],
      TPublishedEntity['info']['authKey']
    >,
    paging?: Paging,
  ): Promise<Connection<Edge<TPublishedEntity, ErrorType>> | null>;

  getTotalCount(
    query?: PublishedQuery<
      TPublishedEntity['info']['type'],
      TPublishedValueItem['type'],
      TPublishedEntity['info']['authKey']
    >,
  ): Promise<number>;
}

export const PublishedClientOperationName = {
  getEntities: 'getEntities',
  getEntity: 'getEntity',
  getSchemaSpecification: 'getSchemaSpecification',
  getTotalCount: 'getTotalCount',
  sampleEntities: 'sampleEntities',
  searchEntities: 'searchEntities',
} as const;
type PublishedClientOperationName = keyof typeof PublishedClientOperationName;

type MethodParameters<
  TName extends keyof PublishedClient,
  TClient extends PublishedClient<
    PublishedEntity<string, object>,
    ValueItem<string, object>
  > = PublishedClient,
> = Parameters<TClient[TName]>;
type MethodReturnType<T extends keyof PublishedClient> = Awaited<ReturnType<PublishedClient[T]>>;
type MethodReturnTypeWithoutPromise<
  TName extends keyof PublishedClient,
  TClient extends PublishedClient<
    PublishedEntity<string, object>,
    ValueItem<string, object>
  > = PublishedClient,
> = Awaited<
  PromiseResult<MethodReturnTypeOk<TName, TClient>, MethodReturnTypeError<TName, TClient>>
>;
type MethodReturnTypeOk<
  TName extends keyof PublishedClient,
  TClient extends PublishedClient<
    PublishedEntity<string, object>,
    ValueItem<string, object>
  > = PublishedClient,
> = OkFromResult<ReturnType<TClient[TName]>>;
type MethodReturnTypeError<
  TName extends keyof PublishedClient,
  TClient extends PublishedClient<
    PublishedEntity<string, object>,
    ValueItem<string, object>
  > = PublishedClient,
> = ErrorFromResult<ReturnType<TClient[TName]>>;

interface PublishedClientOperationArguments {
  [PublishedClientOperationName.getEntities]: MethodParameters<'getEntities'>;
  [PublishedClientOperationName.getEntity]: MethodParameters<'getEntity'>;
  [PublishedClientOperationName.getSchemaSpecification]: MethodParameters<'getSchemaSpecification'>;
  [PublishedClientOperationName.getTotalCount]: MethodParameters<'getTotalCount'>;
  [PublishedClientOperationName.sampleEntities]: MethodParameters<'sampleEntities'>;
  [PublishedClientOperationName.searchEntities]: MethodParameters<'searchEntities'>;
}

interface PublishedClientOperationReturn {
  [PublishedClientOperationName.getEntities]: MethodReturnType<'getEntities'>;
  [PublishedClientOperationName.getEntity]: MethodReturnType<'getEntity'>;
  [PublishedClientOperationName.getSchemaSpecification]: MethodReturnType<'getSchemaSpecification'>;
  [PublishedClientOperationName.getTotalCount]: MethodReturnType<'getTotalCount'>;
  [PublishedClientOperationName.sampleEntities]: MethodReturnType<'sampleEntities'>;
  [PublishedClientOperationName.searchEntities]: MethodReturnType<'searchEntities'>;
}

interface PublishedClientOperationReturnOk {
  [PublishedClientOperationName.getEntities]: MethodReturnTypeOk<'getEntities'>;
  [PublishedClientOperationName.getEntity]: MethodReturnTypeOk<'getEntity'>;
  [PublishedClientOperationName.getSchemaSpecification]: MethodReturnTypeOk<'getSchemaSpecification'>;
  [PublishedClientOperationName.getTotalCount]: MethodReturnTypeOk<'getTotalCount'>;
  [PublishedClientOperationName.sampleEntities]: MethodReturnTypeOk<'sampleEntities'>;
  [PublishedClientOperationName.searchEntities]: MethodReturnTypeOk<'searchEntities'>;
}

interface PublishedClientOperationReturnError {
  [PublishedClientOperationName.getEntities]: MethodReturnTypeError<'getEntities'>;
  [PublishedClientOperationName.getEntity]: MethodReturnTypeError<'getEntity'>;
  [PublishedClientOperationName.getSchemaSpecification]: MethodReturnTypeError<'getSchemaSpecification'>;
  [PublishedClientOperationName.getTotalCount]: MethodReturnTypeError<'getTotalCount'>;
  [PublishedClientOperationName.sampleEntities]: MethodReturnTypeError<'sampleEntities'>;
  [PublishedClientOperationName.searchEntities]: MethodReturnTypeError<'searchEntities'>;
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

  getEntity(
    reference: EntityReference,
  ): Promise<PublishedClientOperationReturn[typeof PublishedClientOperationName.getEntity]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getEntity,
      args: [reference],
      modifies: false,
    });
  }

  getEntities(
    references: EntityReference[],
  ): Promise<PublishedClientOperationReturn[typeof PublishedClientOperationName.getEntities]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getEntities,
      args: [references],
      modifies: false,
    });
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

  getTotalCount(
    query?: PublishedQuery,
  ): Promise<PublishedClientOperationReturn[typeof PublishedClientOperationName.getTotalCount]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getTotalCount,
      args: [query],
      modifies: false,
    });
  }

  sampleEntities(
    query?: PublishedQuery,
    options?: EntitySamplingOptions,
  ): PromiseResult<
    EntitySamplingPayload<PublishedEntity>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  > {
    return this.executeOperation({
      name: PublishedClientOperationName.sampleEntities,
      args: [query, options],
      modifies: false,
    });
  }

  searchEntities(
    query?: PublishedSearchQuery,
    paging?: Paging,
  ): Promise<PublishedClientOperationReturn[typeof PublishedClientOperationName.searchEntities]> {
    return this.executeOperation({
      name: PublishedClientOperationName.searchEntities,
      args: [query, paging],
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

  async getEntities(
    references: EntityReference[],
  ): Promise<
    Result<
      PublishedEntity<string, Record<string, unknown>, string>,
      'BadRequest' | 'NotAuthorized' | 'NotFound' | 'Generic'
    >[]
  > {
    return (await this.client.getEntities(references)).valueOrThrow();
  }

  async sampleEntities(
    query?: PublishedQuery<string, string> | undefined,
    options?: EntitySamplingOptions | undefined,
  ): Promise<EntitySamplingPayload<PublishedEntity<string, Record<string, unknown>, string>>> {
    return (await this.client.sampleEntities(query, options)).valueOrThrow();
  }

  async searchEntities(
    query?: PublishedSearchQuery<string> | undefined,
    paging?: Paging | undefined,
  ): Promise<Connection<
    Edge<PublishedEntity<string, Record<string, unknown>, string>, ErrorType>
  > | null> {
    return (await this.client.searchEntities(query, paging)).valueOrThrow();
  }

  async getTotalCount(query?: PublishedQuery<string, string> | undefined): Promise<number> {
    return (await this.client.getTotalCount(query)).valueOrThrow();
  }
}

export function createBasePublishedClient<
  TContext extends ClientContext,
  TClient extends PublishedClient<
    PublishedEntity<string, object>,
    ValueItem<string, object>
  > = PublishedClient,
>(option: {
  context: TContext | ContextProvider<TContext>;
  pipeline: PublishedClientMiddleware<TContext>[];
}): TClient {
  return new BasePublishedClient(option) as unknown as TClient;
}

export async function executePublishedClientOperationFromJson(
  publishedClient: PublishedClient<PublishedEntity<string, object>, ValueItem<string, object>>,
  operationName: LooseAutocomplete<PublishedClientOperationName>,
  operationArgs: PublishedClientJsonOperationArgs,
): PromiseResult<unknown, ErrorType> {
  const name = operationName as PublishedClientOperationName;
  switch (name) {
    case PublishedClientOperationName.getEntities: {
      const [references] =
        operationArgs as PublishedClientOperationArguments[typeof PublishedClientOperationName.getEntities];
      return await publishedClient.getEntities(references);
    }
    case PublishedClientOperationName.getEntity: {
      const [reference] =
        operationArgs as PublishedClientOperationArguments[typeof PublishedClientOperationName.getEntity];
      return await publishedClient.getEntity(reference);
    }
    case PublishedClientOperationName.getSchemaSpecification: {
      return await publishedClient.getSchemaSpecification();
    }
    case PublishedClientOperationName.getTotalCount: {
      const [query] =
        operationArgs as PublishedClientOperationArguments[typeof PublishedClientOperationName.getTotalCount];
      return await publishedClient.getTotalCount(query);
    }
    case PublishedClientOperationName.sampleEntities: {
      const [query, options] =
        operationArgs as PublishedClientOperationArguments[typeof PublishedClientOperationName.sampleEntities];
      return await publishedClient.sampleEntities(query, options);
    }
    case PublishedClientOperationName.searchEntities: {
      const [query, paging] =
        operationArgs as PublishedClientOperationArguments[typeof PublishedClientOperationName.searchEntities];
      return await publishedClient.searchEntities(query, paging);
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
    ValueItem<string, object>
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
        (value as JsonResult<JsonPublishedEntity, typeof ErrorType.NotFound>[]).map(
          (jsonItemResult) => {
            const itemResult = convertJsonResult(jsonItemResult);
            return itemResult.isOk() ? itemResult.map(convertJsonPublishedEntity) : itemResult;
          },
        ),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case PublishedClientOperationName.getEntity: {
      const result: MethodReturnTypeWithoutPromise<'getEntity'> = ok(
        convertJsonPublishedEntity(value as JsonPublishedEntity),
      );
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case PublishedClientOperationName.getSchemaSpecification:
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;
    case PublishedClientOperationName.getTotalCount:
      return ok(value) as MethodReturnTypeWithoutPromise<TName, TClient>;
    case PublishedClientOperationName.sampleEntities: {
      const payload = value as EntitySamplingPayload<JsonPublishedEntity>;
      const result: MethodReturnTypeWithoutPromise<'sampleEntities'> = ok({
        ...payload,
        items: payload.items.map(convertJsonPublishedEntity),
      });
      return result as MethodReturnTypeWithoutPromise<TName, TClient>;
    }
    case PublishedClientOperationName.searchEntities: {
      const result: MethodReturnTypeWithoutPromise<'searchEntities'> = ok(
        convertJsonConnection(
          value as JsonConnection<JsonEdge<JsonPublishedEntity, ErrorType>> | null,
          convertJsonPublishedEntityEdge,
        ),
      );
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

function convertJsonPublishedEntityEdge(edge: JsonEdge<JsonPublishedEntity, ErrorType>) {
  return convertJsonEdge(edge, convertJsonPublishedEntity);
}
