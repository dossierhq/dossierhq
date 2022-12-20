import { assertExhaustive } from './Asserts.js';
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
} from './Types.js';

export interface PublishedClient<
  TPublishedEntity extends PublishedEntity<string, object> = PublishedEntity
> {
  getSchemaSpecification(): PromiseResult<PublishedSchemaSpecification, typeof ErrorType.Generic>;

  getEntity(
    reference: EntityReference | UniqueIndexReference
  ): PromiseResult<
    TPublishedEntity,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >;

  getEntities(
    references: EntityReference[]
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
    query?: PublishedQuery<TPublishedEntity['info']['type']>,
    options?: EntitySamplingOptions
  ): PromiseResult<
    EntitySamplingPayload<TPublishedEntity>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  searchEntities(
    query?: PublishedSearchQuery<TPublishedEntity['info']['type']>,
    paging?: Paging
  ): PromiseResult<
    Connection<Edge<TPublishedEntity, ErrorType>> | null,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;

  getTotalCount(
    query?: PublishedQuery<TPublishedEntity['info']['type']>
  ): PromiseResult<
    number,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;
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

type MethodParameters<T extends keyof PublishedClient> = Parameters<PublishedClient[T]>;
type MethodReturnType<T extends keyof PublishedClient> = Awaited<ReturnType<PublishedClient[T]>>;
type MethodReturnTypeWithoutPromise<T extends keyof PublishedClient> = Awaited<
  PromiseResult<MethodReturnTypeOk<T>, MethodReturnTypeError<T>>
>;
type MethodReturnTypeOk<T extends keyof PublishedClient> = OkFromResult<
  ReturnType<PublishedClient[T]>
>;
type MethodReturnTypeError<T extends keyof PublishedClient> = ErrorFromResult<
  ReturnType<PublishedClient[T]>
>;

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
  TName extends PublishedClientOperationName = PublishedClientOperationName
> = Operation<
  TName,
  PublishedClientOperationArguments[TName],
  PublishedClientOperationReturnOk[TName],
  PublishedClientOperationReturnError[TName]
>;

export type PublishedClientMiddleware<TContext extends ClientContext> = Middleware<
  TContext,
  PublishedClientOperation
>;

export type PublishedClientJsonOperationArgs<
  TName extends PublishedClientOperationName = PublishedClientOperationName
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
    reference: EntityReference
  ): Promise<PublishedClientOperationReturn[typeof PublishedClientOperationName.getEntity]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getEntity,
      args: [reference],
      modifies: false,
    });
  }

  getEntities(
    references: EntityReference[]
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
    query?: PublishedQuery
  ): Promise<PublishedClientOperationReturn[typeof PublishedClientOperationName.getTotalCount]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getTotalCount,
      args: [query],
      modifies: false,
    });
  }

  sampleEntities(
    query?: PublishedQuery,
    options?: EntitySamplingOptions
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
    paging?: Paging
  ): Promise<PublishedClientOperationReturn[typeof PublishedClientOperationName.searchEntities]> {
    return this.executeOperation({
      name: PublishedClientOperationName.searchEntities,
      args: [query, paging],
      modifies: false,
    });
  }

  private async executeOperation<TName extends PublishedClientOperationName>(
    operation: OperationWithoutCallbacks<PublishedClientOperation<TName>>
  ): PromiseResult<
    PublishedClientOperationReturnOk[TName],
    PublishedClientOperationReturnError[TName]
  > {
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

export function createBasePublishedClient<
  TContext extends ClientContext,
  TClient extends PublishedClient<PublishedEntity<string, object>> = PublishedClient
>(option: {
  context: TContext | ContextProvider<TContext>;
  pipeline: PublishedClientMiddleware<TContext>[];
}): TClient {
  return new BasePublishedClient(option) as unknown as TClient;
}

export async function executePublishedClientOperationFromJson(
  publishedClient: PublishedClient<PublishedEntity<string, object>>,
  operationName: PublishedClientOperationName | string,
  operationArgs: PublishedClientJsonOperationArgs
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

export function convertJsonPublishedClientResult<TName extends PublishedClientOperationName>(
  operationName: TName,
  jsonResult: Result<unknown, ErrorType>
): MethodReturnTypeWithoutPromise<TName> {
  if (jsonResult.isError()) {
    //TODO check expected types
    return jsonResult as MethodReturnTypeWithoutPromise<TName>;
  }
  const { value } = jsonResult;
  switch (operationName) {
    case PublishedClientOperationName.getEntities: {
      const result: MethodReturnTypeWithoutPromise<
        typeof PublishedClientOperationName.getEntities
      > = ok(
        (value as JsonResult<JsonPublishedEntity, typeof ErrorType.NotFound>[]).map(
          (jsonItemResult) => {
            const itemResult = convertJsonResult(jsonItemResult);
            return itemResult.isOk() ? itemResult.map(convertJsonPublishedEntity) : itemResult;
          }
        )
      );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case PublishedClientOperationName.getEntity: {
      const result: MethodReturnTypeWithoutPromise<typeof PublishedClientOperationName.getEntity> =
        ok(convertJsonPublishedEntity(value as JsonPublishedEntity));
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case PublishedClientOperationName.getSchemaSpecification:
      return ok(value) as MethodReturnTypeWithoutPromise<TName>;
    case PublishedClientOperationName.getTotalCount:
      return ok(value) as MethodReturnTypeWithoutPromise<TName>;
    case PublishedClientOperationName.sampleEntities: {
      const payload = value as EntitySamplingPayload<JsonPublishedEntity>;
      const result: MethodReturnTypeWithoutPromise<
        typeof PublishedClientOperationName.sampleEntities
      > = ok({
        ...payload,
        items: payload.items.map((it) => convertJsonPublishedEntity(it)),
      });
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case PublishedClientOperationName.searchEntities: {
      const result: MethodReturnTypeWithoutPromise<
        typeof PublishedClientOperationName.searchEntities
      > = ok(
        convertJsonConnection(
          value as JsonConnection<JsonEdge<JsonPublishedEntity, ErrorType>> | null,
          convertJsonPublishedEntityEdge
        )
      );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    default:
      assertExhaustive(operationName);
  }
}

function convertJsonPublishedEntityEdge(edge: JsonEdge<JsonPublishedEntity, ErrorType>) {
  return convertJsonEdge(edge, convertJsonPublishedEntity);
}
