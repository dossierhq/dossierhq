import type { Logger } from '@dossierhq/core';
import type {
  DatabaseAdapter,
  Session,
  Transaction,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { TransactionContextImpl } from '@jonasb/datadata-database-adapter';

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
    transaction: Transaction | null = null
  ) {
    super(databaseAdapter, logger, transaction);
  }

  protected copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction
  ): InternalContext {
    return new InternalContextImpl(databaseAdapter, this.logger, transaction);
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
    transaction: Transaction | null = null
  ) {
    super(databaseAdapter, logger, transaction);
    this.session = session;
    this.defaultAuthKeys = defaultAuthKeys;
  }

  protected copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction
  ): SessionContext {
    return new SessionContextImpl(
      this.session,
      this.defaultAuthKeys,
      databaseAdapter,
      this.logger,
      transaction
    );
  }
}
