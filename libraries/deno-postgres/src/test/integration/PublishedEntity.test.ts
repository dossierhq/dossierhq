import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
} from "@dossierhq/integration-test";
import type { Server } from "@dossierhq/server";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "../TestUtils.ts";

registerTestSuite(
  createPublishedEntityTestSuite({
    before: async () => {
      const { adminSchema, server } = (
        await initializeIntegrationTestServer()
      ).valueOrThrow();

      const readOnlyEntityRepository = (
        await createReadOnlyEntityRepository(server, "published-entity")
      ).valueOrThrow();

      return [{ adminSchema, server, readOnlyEntityRepository }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  }),
);
