import { config } from "dotenv";
import { createPostgresAdapter } from "./PostgresAdapter.ts";

export function createDotenvAdapter() {
  return createPostgresAdapter(
    config().EXAMPLES_DENO_DATABASE_URL,
  );
}
