import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { DatabaseAdapter, Queryable, Server, Session } from '.';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Context<TContext extends Context<any> = Context<any>> {
  readonly server: Server;
  readonly databaseAdapter: DatabaseAdapter;
  readonly transactionQueryable: Queryable | null;

  withTransaction<TOk, TError extends ErrorType>(
    callback: (context: TContext) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;
}

export interface AuthContext extends Context<AuthContext> {
  withTransaction<TOk, TError extends ErrorType>(
    callback: (context: AuthContext) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;
}

export interface SessionContext extends Context<SessionContext> {
  readonly session: Session;

  withTransaction<TOk, TError extends ErrorType>(
    callback: (context: SessionContext) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
abstract class ContextImpl<TContext extends Context<any>> implements Context<TContext> {
  readonly server: Server;
  readonly databaseAdapter: DatabaseAdapter;
  readonly transactionQueryable: Queryable | null;

  constructor(server: Server, databaseAdapter: DatabaseAdapter, queryable: Queryable | null) {
    this.server = server;
    this.databaseAdapter = databaseAdapter;
    this.transactionQueryable = queryable;
  }

  protected abstract copyWithNewQueryable(transactionQueryable: Queryable): TContext;

  async withTransaction<TOk, TError extends ErrorType>(
    callback: (context: TContext) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError> {
    if (this.transactionQueryable) {
      // Already in transaction
      return await this.databaseAdapter.withNestedTransaction(
        this.transactionQueryable,
        async () => {
          return callback(this as unknown as TContext);
        }
      );
    }

    return await this.databaseAdapter.withRootTransaction(async (client) => {
      const context = this.copyWithNewQueryable(client);
      return callback(context);
    });
  }
}

export class AuthContextImpl extends ContextImpl<AuthContext> implements AuthContext {
  constructor(
    server: Server,
    databaseAdapter: DatabaseAdapter,
    transactionQueryable: Queryable | null = null
  ) {
    super(server, databaseAdapter, transactionQueryable);
  }

  protected copyWithNewQueryable(transactionQueryable: Queryable): AuthContext {
    return new AuthContextImpl(this.server, this.databaseAdapter, transactionQueryable);
  }
}

export class SessionContextImpl extends ContextImpl<SessionContext> implements SessionContext {
  readonly session: Session;

  constructor(
    server: Server,
    session: Session,
    databaseAdapter: DatabaseAdapter,
    transactionQueryable: Queryable | null = null
  ) {
    super(server, databaseAdapter, transactionQueryable);
    this.session = session;
  }

  protected copyWithNewQueryable(transactionQueryable: Queryable): SessionContext {
    return new SessionContextImpl(
      this.server,
      this.session,
      this.databaseAdapter,
      transactionQueryable
    );
  }
}
