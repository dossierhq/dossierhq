import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
  createSharedClientProvider,
} from "@dossierhq/integration-test";
import type { Server } from "@dossierhq/server";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "../TestUtils.ts";

registerTestSuite(
  createPublishedEntityTestSuite({
    before: async () => {
      const { server } = (
        await initializeIntegrationTestServer()
      ).valueOrThrow();

      const clientProvider = createSharedClientProvider(server);
      const readOnlyEntityRepository = (
        await createReadOnlyEntityRepository(clientProvider, "published-entity")
      ).valueOrThrow();

      return [{ clientProvider, server, readOnlyEntityRepository }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  }),
);
