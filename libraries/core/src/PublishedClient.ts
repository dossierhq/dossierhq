import type {
  Connection,
  ContextProvider,
  Edge,
  PublishedEntity,
  EntityReference,
  EntityReferenceWithAuthKeys,
  JsonConnection,
  JsonEdge,
  JsonResult,
  Paging,
  PromiseResult,
  Query,
  Result,
  SchemaSpecification,
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
import type { ErrorFromPromiseResult, OkFromPromiseResult } from './ErrorResult';
import type { JsonEntity } from './JsonUtils';
import { convertJsonEntity } from './JsonUtils';
import type {
  ClientContext,
  Middleware,
  Operation,
  OperationWithoutCallbacks,
} from './SharedClient';
import { executeOperationPipeline } from './SharedClient';

export interface PublishedClient {
  getSchemaSpecification(): PromiseResult<SchemaSpecification, ErrorType.Generic>;

  getEntity(
    reference: EntityReferenceWithAuthKeys
  ): PromiseResult<
    PublishedEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  getEntities(
    references: EntityReferenceWithAuthKeys[]
  ): PromiseResult<
    Result<
      PublishedEntity,
      ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
    >[],
    ErrorType.Generic
  >;

  searchEntities(
    query?: Query,
    paging?: Paging
  ): PromiseResult<
    Connection<Edge<PublishedEntity, ErrorType>> | null,
    ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
  >;

  getTotalCount(
    query?: Query
  ): PromiseResult<number, ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic>;
}

export enum PublishedClientOperationName {
  getEntities = 'getEntities',
  getEntity = 'getEntity',
  getSchemaSpecification = 'getSchemaSpecification',
  getTotalCount = 'getTotalCount',
  searchEntities = 'searchEntities',
}

type MethodParameters<T extends keyof PublishedClient> = Parameters<PublishedClient[T]>;
type MethodReturnType<T extends keyof PublishedClient> = Awaited<ReturnType<PublishedClient[T]>>;
type MethodReturnTypeWithoutPromise<T extends keyof PublishedClient> = Awaited<
  PromiseResult<MethodReturnTypeOk<T>, MethodReturnTypeError<T>>
>;
type MethodReturnTypeOk<T extends keyof PublishedClient> = OkFromPromiseResult<
  ReturnType<PublishedClient[T]>
>;
type MethodReturnTypeError<T extends keyof PublishedClient> = ErrorFromPromiseResult<
  ReturnType<PublishedClient[T]>
>;

interface PublishedClientOperationArguments {
  [PublishedClientOperationName.getEntities]: MethodParameters<'getEntities'>;
  [PublishedClientOperationName.getEntity]: MethodParameters<'getEntity'>;
  [PublishedClientOperationName.getSchemaSpecification]: MethodParameters<'getSchemaSpecification'>;
  [PublishedClientOperationName.getTotalCount]: MethodParameters<'getTotalCount'>;
  [PublishedClientOperationName.searchEntities]: MethodParameters<'searchEntities'>;
}

interface PublishedClientOperationReturn {
  [PublishedClientOperationName.getEntities]: MethodReturnType<'getEntities'>;
  [PublishedClientOperationName.getEntity]: MethodReturnType<'getEntity'>;
  [PublishedClientOperationName.getSchemaSpecification]: MethodReturnType<'getSchemaSpecification'>;
  [PublishedClientOperationName.getTotalCount]: MethodReturnType<'getTotalCount'>;
  [PublishedClientOperationName.searchEntities]: MethodReturnType<'searchEntities'>;
}

interface PublishedClientOperationReturnOk {
  [PublishedClientOperationName.getEntities]: MethodReturnTypeOk<'getEntities'>;
  [PublishedClientOperationName.getEntity]: MethodReturnTypeOk<'getEntity'>;
  [PublishedClientOperationName.getSchemaSpecification]: MethodReturnTypeOk<'getSchemaSpecification'>;
  [PublishedClientOperationName.getTotalCount]: MethodReturnTypeOk<'getTotalCount'>;
  [PublishedClientOperationName.searchEntities]: MethodReturnTypeOk<'searchEntities'>;
}

interface PublishedClientOperationReturnError {
  [PublishedClientOperationName.getEntities]: MethodReturnTypeError<'getEntities'>;
  [PublishedClientOperationName.getEntity]: MethodReturnTypeError<'getEntity'>;
  [PublishedClientOperationName.getSchemaSpecification]: MethodReturnTypeError<'getSchemaSpecification'>;
  [PublishedClientOperationName.getTotalCount]: MethodReturnTypeError<'getTotalCount'>;
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
    query?: Query
  ): Promise<PublishedClientOperationReturn[PublishedClientOperationName.getTotalCount]> {
    return this.executeOperation({
      name: PublishedClientOperationName.getTotalCount,
      args: [query],
      modifies: false,
    });
  }

  searchEntities(
    query?: Query,
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
        (value as JsonResult<JsonEntity, ErrorType.NotFound>[]).map((jsonItemResult) => {
          const itemResult = convertJsonResult(jsonItemResult);
          return itemResult.isOk() ? itemResult.map(convertJsonEntity) : itemResult;
        })
      );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case PublishedClientOperationName.getEntity: {
      const result: MethodReturnTypeWithoutPromise<PublishedClientOperationName.getEntity> = ok(
        convertJsonEntity(value as JsonEntity)
      );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    case PublishedClientOperationName.getSchemaSpecification:
      return ok(value) as MethodReturnTypeWithoutPromise<TName>;
    case PublishedClientOperationName.getTotalCount:
      return ok(value) as MethodReturnTypeWithoutPromise<TName>;
    case PublishedClientOperationName.searchEntities: {
      const result: MethodReturnTypeWithoutPromise<PublishedClientOperationName.searchEntities> =
        ok(
          convertJsonConnection(
            value as JsonConnection<JsonEdge<JsonEntity, ErrorType>> | null,
            convertJsonEntityEdge
          )
        );
      return result as MethodReturnTypeWithoutPromise<TName>;
    }
    default:
      assertExhaustive(operationName);
  }
}

function convertJsonEntityEdge(edge: JsonEdge<JsonEntity, ErrorType>) {
  return convertJsonEdge(edge, convertJsonEntity);
}
