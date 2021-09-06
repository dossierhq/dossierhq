import type { Logger } from "@jonasb/datadata-core";
import { config } from "dotenv";
import { createPostgresAdapter } from "./PostgresAdapter.ts";

export function createDotenvAdapter() {
  return createPostgresAdapter(
    config().EXAMPLES_DENO_DATABASE_URL,
  );
}

export function createDummyLogger(): Logger {
  const noop = () => {};
  return {
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
  };
}
