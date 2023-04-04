import { createSchemaTestSuite } from "@dossierhq/integration-test";
import type { Server } from "@dossierhq/server";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "../TestUtils.ts";

registerTestSuite(
  createSchemaTestSuite({
    before: async () => {
      const serverInit = (await initializeIntegrationTestServer())
        .valueOrThrow();
      return [serverInit, serverInit];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  }),
);
