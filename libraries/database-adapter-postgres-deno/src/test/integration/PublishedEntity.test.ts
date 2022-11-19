import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
} from "@jonasb/datadata-database-adapter-test-integration";
import type { Server } from "@jonasb/datadata-server";
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
