import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { DatabaseAdapter, Transaction, Server, Session } from '.';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Context<TContext extends Context<any> = Context<any>> {
  readonly server: Server;
  readonly databaseAdapter: DatabaseAdapter;
  readonly transaction: Transaction | null;

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
  readonly transaction: Transaction | null;

  constructor(server: Server, databaseAdapter: DatabaseAdapter, transaction: Transaction | null) {
    this.server = server;
    this.databaseAdapter = databaseAdapter;
    this.transaction = transaction;
  }

  protected abstract copyWithNewTransaction(transaction: Transaction): TContext;

  async withTransaction<TOk, TError extends ErrorType>(
    callback: (context: TContext) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError> {
    if (this.transaction) {
      // Already in transaction
      return await this.databaseAdapter.withNestedTransaction(this.transaction, async () => {
        return callback(this as unknown as TContext);
      });
    }

    return await this.databaseAdapter.withRootTransaction(async (client) => {
      const context = this.copyWithNewTransaction(client);
      return callback(context);
    });
  }
}

export class AuthContextImpl extends ContextImpl<AuthContext> implements AuthContext {
  constructor(
    server: Server,
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction | null = null
  ) {
    super(server, databaseAdapter, transaction);
  }

  protected copyWithNewTransaction(transaction: Transaction): AuthContext {
    return new AuthContextImpl(this.server, this.databaseAdapter, transaction);
  }
}

export class SessionContextImpl extends ContextImpl<SessionContext> implements SessionContext {
  readonly session: Session;

  constructor(
    server: Server,
    session: Session,
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction | null = null
  ) {
    super(server, databaseAdapter, transaction);
    this.session = session;
  }

  protected copyWithNewTransaction(transaction: Transaction): SessionContext {
    return new SessionContextImpl(this.server, this.session, this.databaseAdapter, transaction);
  }
}
