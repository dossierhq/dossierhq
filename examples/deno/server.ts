#!/usr/bin/env -S deno run --import-map=./config/import-map.json --allow-net=localhost:5432 --allow-read=.env,.env.defaults
import type { ErrorType, Logger, PromiseResult } from "@jonasb/datadata-core";
import { notOk, ok } from "@jonasb/datadata-core";
import { createServer } from "@jonasb/datadata-server";
import type {
  AuthorizationAdapter,
  SessionContext,
} from "@jonasb/datadata-server";
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
  authorizationAdapter: createAuthorizationAdapter(),
});
if (serverResult.isError()) throw serverResult.toError();
const server = serverResult.value;
try {
  const sessionResult = await server.createSession({
    provider: "sys",
    identifier: "test",
    defaultAuthKeys: ["none", "subject"],
  });
  if (sessionResult.isError()) throw sessionResult.toError();
  const { context: _context } = sessionResult.value;
} finally {
  await server.shutdown();
}

function createAuthorizationAdapter(): AuthorizationAdapter {
  return {
    resolveAuthorizationKeys<T extends string>(
      context: SessionContext,
      authKeys: T[],
    ): PromiseResult<
      Record<T, string>,
      ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
    > {
      const result = {} as Record<T, string>;
      for (const key of authKeys) {
        let resolved: string;
        if (key === "subject") {
          resolved = `subject:${context.session.subjectId}`;
        } else if (key === "none") {
          resolved = key;
        } else {
          return Promise.resolve(
            notOk.BadRequest(`The authKey ${key} doesn't exist`),
          );
        }
        result[key] = resolved;
      }
      return Promise.resolve(ok(result));
    },
  };
}
