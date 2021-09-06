#!/usr/bin/env -S deno run --import-map=./config/import-map.json --allow-net=localhost:5432 --allow-read=.env,.env.defaults
import type { Logger } from "@jonasb/datadata-core";
import { createServer } from "@jonasb/datadata-server";
import * as log from "std/log/mod.ts";
import { createDotenvAdapter } from "./ServerUtils.ts";

const logger: Logger = {
  error: log.error,
  warn: log.warning,
  info: log.info,
  debug: log.debug,
};
const serverResult = await createServer({
  databaseAdapter: createDotenvAdapter(),
  logger,
});
if (serverResult.isError()) throw serverResult.toError();
const server = serverResult.value;
try {
  const sessionResult = await server.createSession("sys", "test");
  if (sessionResult.isError()) throw sessionResult.toError();
  const { context: _context } = sessionResult.value;
} finally {
  await server.shutdown();
}
