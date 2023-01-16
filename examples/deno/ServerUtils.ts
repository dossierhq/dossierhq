import { createPostgresAdapter } from "@dossierhq/database-adapter-postgres-deno";
import { config } from "dotenv";

export function createDotenvAdapter() {
  return createPostgresAdapter(
    config().EXAMPLES_DENO_DATABASE_URL,
  );
}
