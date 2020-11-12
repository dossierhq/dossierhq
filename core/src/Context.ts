import type { ErrorType, Instance, PromiseResult, Session } from '.';
import type { Pool, Queryable } from './Db';
import * as Db from './Db';

export interface Context<TContext> {
  readonly instance: Instance;
  readonly pool: Pool;
  readonly queryable: Queryable;

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

abstract class ContextImpl<TContext> implements Context<TContext> {
  readonly queryable: Queryable;

  constructor(
    readonly instance: Instance,
    readonly pool: Pool,
    transactionQueryable: Queryable | null
  ) {
    this.queryable = transactionQueryable ?? pool;
  }

  protected abstract copyWithNewQueryable(transactionQueryable: Queryable): TContext;

  async withTransaction<TOk, TError extends ErrorType>(
    callback: (context: TContext) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError> {
    if (this.pool !== this.queryable) {
      // Already in transaction
      return await Db.withNestedTransaction(this, async () => {
        return callback((this as unknown) as TContext);
      });
    }

    return await Db.withRootTransaction(this, async (client) => {
      const context = this.copyWithNewQueryable(client);
      return callback(context);
    });
  }
}

export class AuthContextImpl extends ContextImpl<AuthContext> implements AuthContext {
  constructor(instance: Instance, pool: Pool, transactionQueryable: Queryable | null = null) {
    super(instance, pool, transactionQueryable);
  }

  protected copyWithNewQueryable(transactionQueryable: Queryable): AuthContext {
    return new AuthContextImpl(this.instance, this.pool, transactionQueryable);
  }
}

export class SessionContextImpl extends ContextImpl<SessionContext> implements SessionContext {
  readonly session: Session;

  constructor(
    instance: Instance,
    session: Session,
    pool: Pool,
    transactionQueryable: Queryable | null = null
  ) {
    super(instance, pool, transactionQueryable);
    this.session = session;
  }

  protected copyWithNewQueryable(transactionQueryable: Queryable): SessionContext {
    return new SessionContextImpl(this.instance, this.session, this.pool, transactionQueryable);
  }
}
