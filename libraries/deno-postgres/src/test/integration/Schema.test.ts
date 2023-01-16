import { createSchemaTestSuite } from "@dossierhq/integration-test";
import type { Server } from "@dossierhq/server";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "../TestUtils.ts";

registerTestSuite(
  createSchemaTestSuite({
    before: async () => {
      const { server } = (
        await initializeIntegrationTestServer()
      ).valueOrThrow();

      const sessionResult = server.createSession({
        provider: "test",
        identifier: "id",
        defaultAuthKeys: ["none"],
      });
      const client = server.createAdminClient(() => sessionResult);

      return [{ client }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  }),
);
