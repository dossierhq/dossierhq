import type {
  AdminEntity,
  EntityReference,
  EntityVersionReference,
  ErrorType,
  PromiseResult,
  Result,
} from '..';
import { assertIsDefined } from '..';

export interface AdminClient {
  getEntity(
    reference: EntityReference | EntityVersionReference
  ): PromiseResult<AdminEntity, ErrorType.NotFound>;

  getEntities(references: EntityReference[]): Promise<Result<AdminEntity, ErrorType.NotFound>[]>;
}

export enum AdminClientOperationName {
  GetEntity = 'get-entity',
  GetEntities = 'get-entities',
}

interface AdminClientOperationArguments {
  [AdminClientOperationName.GetEntity]: { reference: EntityReference | EntityVersionReference };
  [AdminClientOperationName.GetEntities]: { references: EntityReference[] };
}

interface AdminClientOperationReturn {
  [AdminClientOperationName.GetEntity]: Result<AdminEntity, ErrorType.NotFound>;
  [AdminClientOperationName.GetEntities]: Result<AdminEntity, ErrorType.NotFound>[];
}

export interface AdminClientOperation<TName extends AdminClientOperationName> {
  readonly name: TName;
  readonly args: AdminClientOperationArguments[TName];
  readonly resolve: (result: AdminClientOperationReturn[TName]) => void;
}

export interface AdminClientMiddleware<TContext> {
  (context: TContext, operation: AdminClientOperation<AdminClientOperationName>): Promise<void>;
}

class BaseAdminClient<TContext> implements AdminClient {
  private readonly resolveContext: () => Promise<TContext>;
  private readonly pipeline: AdminClientMiddleware<TContext>[];

  constructor({
    resolveContext,
    pipeline,
  }: {
    resolveContext: () => Promise<TContext>;
    pipeline: AdminClientMiddleware<TContext>[];
  }) {
    this.resolveContext = resolveContext;
    this.pipeline = pipeline;
  }

  getEntity(
    reference: EntityReference | EntityVersionReference
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.GetEntity]> {
    return this.executeOperation({
      name: AdminClientOperationName.GetEntity,
      args: { reference },
    });
  }

  getEntities(
    references: EntityReference[]
  ): Promise<AdminClientOperationReturn[AdminClientOperationName.GetEntities]> {
    return this.executeOperation({
      name: AdminClientOperationName.GetEntities,
      args: { references },
    });
  }

  private async executeOperation<TName extends AdminClientOperationName>(
    operation: Omit<AdminClientOperation<TName>, 'resolve'>
  ): Promise<AdminClientOperationReturn[TName]> {
    const context = await this.resolveContext();
    let result: AdminClientOperationReturn[TName] | undefined;
    const resolve = (res: AdminClientOperationReturn[TName]) => (result = res);
    const operationWithResolve: AdminClientOperation<TName> = { ...operation, resolve };
    //TODO support pipeline
    await this.pipeline[0](
      context,
      operationWithResolve as unknown as AdminClientOperation<AdminClientOperationName>
    );
    assertIsDefined(result);
    return result;
  }
}

export function createBaseAdminClient<TContext>(option: {
  resolveContext: () => Promise<TContext>;
  pipeline: AdminClientMiddleware<TContext>[];
}): AdminClient {
  return new BaseAdminClient(option);
}
