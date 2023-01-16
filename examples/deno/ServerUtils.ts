import { createPostgresAdapter } from "@dossierhq/deno-postgres";
import { config } from "dotenv";

export function createDotenvAdapter() {
  return createPostgresAdapter(
    config().EXAMPLES_DENO_DATABASE_URL,
  );
}
