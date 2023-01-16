import type { DatabaseAdapter } from "@dossierhq/database-adapter";
import type {
  PostgresDatabaseAdapter,
  PostgresTransaction,
} from "@dossierhq/postgres-core";
import { createPostgresDatabaseAdapterAdapter } from "@dossierhq/postgres-core";
import type { PoolClient } from "postgres";
import { Pool, PostgresError } from "postgres";
import { decode, encode } from "std/encoding/base64.ts";

interface TransactionWrapper extends PostgresTransaction {
  client: PoolClient;
}

const textDecoder = new TextDecoder("utf-8");

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
        savePointCount: 0,
        release: () => {
          client.release();
        },
      };
      return transaction;
    },

    async query<R>(
      transaction: PostgresTransaction | null,
      query: string,
      values: unknown[] | undefined,
    ): Promise<R[]> {
      let result: { rows: R[] };
      if (transaction) {
        result = await getTransaction(transaction).queryObject(query, values);
      } else {
        const poolClient = await pool.connect();
        try {
          result = await poolClient.queryObject<R>(query, values);
        } finally {
          poolClient.release();
        }
      }
      return result.rows;
    },

    isUniqueViolationOfConstraint,

    base64Encode(value) {
      return encode(value);
    },

    base64Decode(value) {
      return textDecoder.decode(decode(value));
    },
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
