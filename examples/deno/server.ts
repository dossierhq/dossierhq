#!/usr/bin/env -S deno run --allow-net=localhost:5432 --allow-read=.env,.env.defaults,.env.example --allow-env
import {
  BackgroundEntityProcessorPlugin,
  createServer,
} from "@dossierhq/server";
import { getLogger } from "./Logger.ts";
import { createDotenvAdapter } from "./ServerUtils.ts";

const logger = getLogger();

const serverResult = await createServer({
  databaseAdapter: createDotenvAdapter(),
  logger,
});
const server = serverResult.valueOrThrow();

const processorPlugin = new BackgroundEntityProcessorPlugin(server, logger);
server.addPlugin(processorPlugin);
processorPlugin.start();

try {
  const sessionResult = await server.createSession({
    provider: "sys",
    identifier: "test",
    logger,
  });
  if (sessionResult.isError()) throw sessionResult.toError();
  const adminClient = server.createDossierClient(sessionResult.value.context);

  (
    await adminClient.updateSchemaSpecification({
      entityTypes: [
        {
          name: "TitleOnly",
          nameField: "title",
          fields: [{ name: "title", type: "String" }],
        },
      ],
    })
  ).throwIfError();

  const createResult = await adminClient.createEntity(
    {
      info: { type: "TitleOnly", name: "Deno test" },
      fields: { title: "Deno test" },
    },
    { publish: true },
  );
  if (createResult.isError()) {
    logger.error("Failed creating entity: %O", createResult);
  } else {
    logger.info("Created entity: %O", createResult.value);
  }
} finally {
  await server.shutdown();
}
