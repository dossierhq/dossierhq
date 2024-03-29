import { createAuthTestSuite } from "@dossierhq/integration-test";
import type { Server } from "@dossierhq/server";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "../TestUtils.ts";

registerTestSuite(
  createAuthTestSuite({
    before: async () => {
      const { server } = (
        await initializeIntegrationTestServer()
      ).valueOrThrow();
      return [{ server }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  }),
);
