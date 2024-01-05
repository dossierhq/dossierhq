import {
  createAdminClientProvider,
  createChangelogTestSuite,
} from "@dossierhq/integration-test";
import type { Server } from "@dossierhq/server";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "../TestUtils.ts";

registerTestSuite(
  createChangelogTestSuite({
    before: async () => {
      const { server } = (
        await initializeIntegrationTestServer()
      ).valueOrThrow();
      return [
        { clientProvider: createAdminClientProvider(server) },
        { server },
      ];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  }),
);
