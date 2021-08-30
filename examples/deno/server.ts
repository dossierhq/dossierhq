#!/usr/bin/env -S deno run --import-map=./config/import-map.json --allow-net=localhost:5432 --allow-read=.env,.env.defaults
import { Auth, Server } from "@jonasb/datadata-server";
import { createDotenvAdapter } from "./ServerUtils.ts";

const server = new Server({ databaseAdapter: createDotenvAdapter() });
const authContext = server.createAuthContext();

const sessionResult = await Auth.createSessionForPrincipal(
  authContext,
  "sys",
  "test",
  { createPrincipalIfMissing: true },
);
if (sessionResult.isOk()) {
  const _context = server.createSessionContext(sessionResult.value);
}

await server.shutdown();
