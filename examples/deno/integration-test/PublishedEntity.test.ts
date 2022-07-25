import type { Server } from "@jonasb/datadata-server";
import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
} from "@jonasb/datadata-database-adapter-test-integration";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "./TestUtils.ts";

registerTestSuite(
  createPublishedEntityTestSuite({
    before: async () => {
      const server = (await initializeIntegrationTestServer()).valueOrThrow();

      const readOnlyEntityRepository = (
        await createReadOnlyEntityRepository(server)
      ).valueOrThrow();

      return [
        { server, readOnlyEntityRepository },
        { server },
      ];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  }),
);
