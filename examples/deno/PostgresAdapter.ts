import type { DatabaseAdapter } from "@jonasb/datadata-server";
import type {
  PostgresDatabaseAdapter,
  PostgresTransaction,
} from "@jonasb/datadata-database-adapter-postgres-core";
import { createPostgresDatabaseAdapterAdapter } from "@jonasb/datadata-database-adapter-postgres-core";
import type { PoolClient } from "postgres";
import { Pool, PostgresError } from "postgres";

//TODO
// PgTypes.setTypeParser(PgTypes.builtins.INT8, BigInt);
// // 1016 = _int8 (int8 array)
// PgTypes.setTypeParser(1016, (value) => PgTypes.arrayParser(value, BigInt));
// PgTypes.setTypeParser(PgTypes.builtins.TIMESTAMPTZ, (value) => {
//   if (value === "-infinity") return Number.NEGATIVE_INFINITY;
//   if (value === "infinity") return Number.POSITIVE_INFINITY;
//   return Temporal.Instant.from(value);
// });

interface TransactionWrapper extends PostgresTransaction {
  client: PoolClient;
}

function getTransaction(transaction: PostgresTransaction): PoolClient {
  return (transaction as TransactionWrapper).client;
}

export function createPostgresAdapter(databaseUrl: string): DatabaseAdapter {
  const pool = new Pool(databaseUrl, 4, true);
  const adapter: PostgresDatabaseAdapter = {
    disconnect: () => pool.end(),
    createTransaction: async () => {
      const client = await pool.connect();
      const transaction: TransactionWrapper = {
        _type: "Transaction",
        client,
        release: () => {
          client.release();
        },
      };
      return transaction;
    },
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

function isUniqueViolationOfConstraint(
  error: unknown,
  constraintName: string,
): boolean {
  const uniqueViolation = "23505";
  return error instanceof PostgresError &&
    error.fields.code === uniqueViolation &&
    error.fields.constraint === constraintName;
}
