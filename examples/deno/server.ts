#!/usr/bin/env -S deno run --allow-net=localhost:5432 --allow-read=.env,.env.defaults
import {
  createServer,
  NoneAndSubjectAuthorizationAdapter,
} from "@dossierhq/server";
import { createDotenvAdapter } from "./ServerUtils.ts";
import { getLogger } from "./Logger.ts";

const logger = getLogger();

const serverResult = await createServer({
  databaseAdapter: createDotenvAdapter(),
  logger,
  authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
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
  const adminClient = server.createAdminClient(sessionResult.value.context);
  const createResult = await adminClient.createEntity({
    info: { type: "TitleOnly", name: "Deno test", authKey: "none" },
    fields: { title: "Deno test" },
  }, { publish: true });
  if (createResult.isError()) {
    logger.error("Failed creating entity: %O", createResult);
  } else {
    logger.info("Created entity: %O", createResult.value);
  }
} finally {
  await server.shutdown();
}
