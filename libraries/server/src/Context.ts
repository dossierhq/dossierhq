import type { Logger } from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabasePerformanceCallbacks,
  Session,
  Transaction,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { TransactionContextImpl } from '@dossierhq/database-adapter';

const internalContextSymbol = Symbol('InternalContext');
const sessionContextSymbol = Symbol('SessionContext');

export interface InternalContext extends TransactionContext<InternalContext> {
  [internalContextSymbol]: never;
}

export interface SessionContext extends TransactionContext<SessionContext> {
  readonly session: Session;
  readonly defaultAuthKeys: readonly string[];
  [sessionContextSymbol]: never;
}

export class InternalContextImpl
  extends TransactionContextImpl<InternalContext>
  implements InternalContext
{
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  [internalContextSymbol]: never;

  constructor(
    databaseAdapter: DatabaseAdapter,
    logger: Logger,
    databasePerformance: DatabasePerformanceCallbacks | null,
    transaction: Transaction | null = null,
  ) {
    super(databaseAdapter, logger, databasePerformance, transaction);
  }

  protected copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction,
  ): InternalContext {
    return new InternalContextImpl(
      databaseAdapter,
      this.logger,
      this.databasePerformance,
      transaction,
    );
  }
}

export class SessionContextImpl
  extends TransactionContextImpl<SessionContext>
  implements SessionContext
{
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  [sessionContextSymbol]: never;

  readonly session: Session;
  readonly defaultAuthKeys: readonly string[];

  constructor(
    session: Session,
    defaultAuthKeys: readonly string[],
    databaseAdapter: DatabaseAdapter,
    logger: Logger,
    databasePerformance: DatabasePerformanceCallbacks | null,
    transaction: Transaction | null = null,
  ) {
    super(databaseAdapter, logger, databasePerformance, transaction);
    this.session = session;
    this.defaultAuthKeys = defaultAuthKeys;
  }

  protected copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction,
  ): SessionContext {
    return new SessionContextImpl(
      this.session,
      this.defaultAuthKeys,
      databaseAdapter,
      this.logger,
      this.databasePerformance,
      transaction,
    );
  }
}
