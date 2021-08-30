import type { ErrorType, PromiseResult } from "@jonasb/datadata-core";
import type { DatabaseAdapter, Transaction } from "@jonasb/datadata-server";
import type { PostgresDatabaseAdapter } from "@jonasb/datadata-database-adapter-postgres-core";
import { createPostgresDatabaseAdapterAdapter } from "@jonasb/datadata-database-adapter-postgres-core";
import { Pool, Transaction as PgTransaction } from "postgres";

//TODO
// PgTypes.setTypeParser(PgTypes.builtins.INT8, BigInt);
// // 1016 = _int8 (int8 array)
// PgTypes.setTypeParser(1016, (value) => PgTypes.arrayParser(value, BigInt));
// PgTypes.setTypeParser(PgTypes.builtins.TIMESTAMPTZ, (value) => {
//   if (value === "-infinity") return Number.NEGATIVE_INFINITY;
//   if (value === "infinity") return Number.POSITIVE_INFINITY;
//   return Temporal.Instant.from(value);
// });

interface TransactionWrapper extends Transaction {
  wrapped: PgTransaction;
}

function getTransaction(transaction: Transaction): PgTransaction {
  return (transaction as TransactionWrapper).wrapped;
}

export function createPostgresAdapter(databaseUrl: string): DatabaseAdapter {
  const pool = new Pool(databaseUrl, 4, true);
  const adapter: PostgresDatabaseAdapter = {
    disconnect: () => pool.end(),
    withRootTransaction: (callback) => withRootTransaction(pool, callback),
    withNestedTransaction,
    query: async (transaction, query, values) => {
      let result: { rows: unknown[] };
      if (transaction) {
        result = await getTransaction(transaction).queryObject(
          query,
          ...(values ?? []),
        );
      } else {
        const poolClient = await pool.connect();
        try {
          result = await poolClient.queryObject(query, ...(values ?? []));
        } finally {
          poolClient.release();
        }
      }
      // deno-lint-ignore no-explicit-any
      return result.rows as any[];
    },
    isUniqueViolationOfConstraint,
  };
  return createPostgresDatabaseAdapterAdapter(adapter);
}

async function withRootTransaction<TOk, TError extends ErrorType>(
  pool: Pool,
  callback: (transaction: Transaction) => PromiseResult<TOk, TError>,
): PromiseResult<TOk, TError> {
  const client = await pool.connect();
  const transaction = client.createTransaction("transaction name");
  const clientWrapper: TransactionWrapper = {
    _type: "Transaction",
    wrapped: transaction,
  };
  try {
    await transaction.begin();
    const result = await callback(clientWrapper);
    if (result.isOk()) {
      await transaction.commit();
    } else {
      await transaction.rollback();
    }
    return result;
  } catch (e) {
    await transaction.rollback();
    throw e;
  } finally {
    client.release();
  }
}

async function withNestedTransaction<TOk, TError extends ErrorType>(
  transaction: Transaction,
  callback: () => PromiseResult<TOk, TError>,
): PromiseResult<TOk, TError> {
  const parentTransaction = getTransaction(transaction);
  try {
    await parentTransaction.queryArray("BEGIN");
    const result = await callback();
    if (result.isOk()) {
      await parentTransaction.queryArray("COMMIT");
    } else {
      await parentTransaction.queryArray("ROLLBACK");
    }
    return result;
  } catch (e) {
    await parentTransaction.queryArray("ROLLBACK");
    throw e;
  }
}

function isUniqueViolationOfConstraint(
  _error: unknown,
  _constraintName: string,
): boolean {
  throw new Error("TODO");
  // const unique_violation = "23505";
  // return false;
  //TODO   (
  //     error instanceof DatabaseError &&
  //     error.code === unique_violation &&
  //     error.constraint === constraintName
  //   );
}
