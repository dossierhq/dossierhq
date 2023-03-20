import { createPostgresAdapter } from "@dossierhq/deno-postgres";
import { loadSync } from "std/dotenv/mod.ts";

export function createDotenvAdapter() {
  return createPostgresAdapter(
    loadSync().EXAMPLES_DENO_DATABASE_URL,
  );
}
