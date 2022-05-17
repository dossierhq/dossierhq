import type {
  Connection,
  ContextProvider,
  Edge,
  EntityReference,
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorFromResult,
  JsonConnection,
  JsonEdge,
  JsonResult,
  OkFromResult,
  Paging,
  PromiseResult,
  PublishedEntity,
  PublishedQuery,
  PublishedSchemaSpecification,
  PublishedSearchQuery,
  Result,
} from '.';
import {
  assertExhaustive,
  convertJsonConnection,
  convertJsonEdge,
  convertJsonResult,
  ErrorType,
  notOk,
  ok,
} from '.';
import type { JsonPublishedEntity } from './JsonUtils';
import { convertJsonPublishedEntity } from './JsonUtils';
import type {
  ClientContext,
  Middleware,
  Operation,
  OperationWithoutCallbacks,
} from './SharedClient';
import { executeOperationPipeline } from './SharedClient';

export interface PublishedClient {
  getSchemaSpecification(): PromiseResult<PublishedSchemaSpecification, ErrorType.Generic>;

  getEntity(
    reference: EntityReference
  ): PromiseResult<
    PublishedEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  getEntities(
    references: EntityReference[]
  ): PromiseResult<
    Result<
      PublishedEntity,
      ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
    >[],
    ErrorType.Generic
  >;

  sampleEntities(
    query?: PublishedQuery,
    options?: EntitySamplingOptions
  ): PromiseResult<
    EntitySamplingPayload<PublishedEntity>,
    ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  searchEntities(
    query?: PublishedSearchQuery,
    paging?: Paging
  ): PromiseResult<
    Connection<Edge<PublishedEntity, ErrorType>> | null,
    ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  getTotalCount(
    query?: PublishedQuery
  ): PromiseResult<number, ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic>;
}

export enum PublishedClientOperationName {
  getEntities = 'getEntities',
  getEntity = 'getEntity',
  getSchemaSpecification = 'getSchemaSpecification',
  getTotalCount = 'getTotalCount',
  sampleEntities = 'sampleEntities',
  searchEntities = 'searchEntities',
}

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

export type PublishedClientJsonOperation<
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
  ): Promise<PublishedClientOperationReturn[PublishedClientOperationName.getEntity]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getEntity,
      args: [reference],
      modifies: false,
    });
  }

  getEntities(
    references: EntityReference[]
  ): Promise<PublishedClientOperationReturn[PublishedClientOperationName.getEntities]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getEntities,
      args: [references],
      modifies: false,
    });
  }

  getSchemaSpecification(): Promise<
    PublishedClientOperationReturn[PublishedClientOperationName.getSchemaSpecification]
  > {
    return this.executeOperation({
      name: PublishedClientOperationName.getSchemaSpecification,
      args: [],
      modifies: false,
    });
  }

  getTotalCount(
    query?: PublishedQuery
  ): Promise<PublishedClientOperationReturn[PublishedClientOperationName.getTotalCount]> {
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
    ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
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
  ): Promise<PublishedClientOperationReturn[PublishedClientOperationName.searchEntities]> {
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

export function createBasePublishedClient<TContext extends ClientContext>(option: {
  context: TContext | ContextProvider<TContext>;
  pipeline: PublishedClientMiddleware<TContext>[];
}): PublishedClient {
  return new BasePublishedClient(option);
}

export function convertPublishedClientOperationToJson(
  operation: PublishedClientOperation
): PublishedClientJsonOperation {
  const { args } = operation;
  switch (operation.name) {
    case PublishedClientOperationName.getEntities:
    case PublishedClientOperationName.getEntity:
    case PublishedClientOperationName.getSchemaSpecification:
    case PublishedClientOperationName.sampleEntities:
    case PublishedClientOperationName.searchEntities:
    case PublishedClientOperationName.getTotalCount:
      //TODO cleanup args? e.g. reference, keep only id
      return args;
    default:
      assertExhaustive(operation.name);
  }
}

export async function executePublishedClientOperationFromJson<
  TName extends PublishedClientOperationName
>(
  publishedClient: PublishedClient,
  operationName: TName,
  operation: PublishedClientJsonOperation
): PromiseResult<unknown, ErrorType> {
  switch (operationName) {
    case PublishedClientOperationName.getEntities: {
      const [references] =
        operation as PublishedClientOperationArguments[PublishedClientOperationName.getEntities];
      return await publishedClient.getEntities(references);
    }
    case PublishedClientOperationName.getEntity: {
      const [reference] =
        operation as PublishedClientOperationArguments[PublishedClientOperationName.getEntity];
      return await publishedClient.getEntity(reference);
    }
    case PublishedClientOperationName.getSchemaSpecification: {
      return await publishedClient.getSchemaSpecification();
    }
    case PublishedClientOperationName.getTotalCount: {
      const [query] =
        operation as PublishedClientOperationArguments[PublishedClientOperationName.getTotalCount];
      return await publishedClient.getTotalCount(query);
    }
    case PublishedClientOperationName.sampleEntities: {
      const [query, options] =
        operation as PublishedClientOperationArguments[PublishedClientOperationName.sampleEntities];
      return await publishedClient.sampleEntities(query, options);
    }
    case PublishedClientOperationName.searchEntities: {
      const [query, paging] =
        operation as PublishedClientOperationArguments[PublishedClientOperationName.searchEntities];
      return await publishedClient.searchEntities(query, paging);
    }
    default:
      assertExhaustive(operationName);
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
      const result: MethodReturnTypeWithoutPromise<PublishedClientOperationName.getEntities> = ok(
        (value as JsonResult<JsonPublishedEntity, ErrorType.NotFound>[]).map((jsonItemResult) => {
          const itemResult = convertJsonResult(jsonItemResult);
          return itemResult.isOk() ? itemResult.map(convertJsonPublishedEntity) : itemResult;
        })
      );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case PublishedClientOperationName.getEntity: {
      const result: MethodReturnTypeWithoutPromise<PublishedClientOperationName.getEntity> = ok(
        convertJsonPublishedEntity(value as JsonPublishedEntity)
      );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case PublishedClientOperationName.getSchemaSpecification:
      return ok(value) as MethodReturnTypeWithoutPromise<TName>;
    case PublishedClientOperationName.getTotalCount:
      return ok(value) as MethodReturnTypeWithoutPromise<TName>;
    case PublishedClientOperationName.sampleEntities: {
      const payload = value as EntitySamplingPayload<JsonPublishedEntity>;
      const result: MethodReturnTypeWithoutPromise<PublishedClientOperationName.sampleEntities> =
        ok({
          ...payload,
          items: payload.items.map((it) => convertJsonPublishedEntity(it)),
        });
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case PublishedClientOperationName.searchEntities: {
      const result: MethodReturnTypeWithoutPromise<PublishedClientOperationName.searchEntities> =
        ok(
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
