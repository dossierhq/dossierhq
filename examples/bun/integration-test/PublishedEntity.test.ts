import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
} from "@jonasb/datadata-database-adapter-test-integration";
import type { Server } from "@jonasb/datadata-server";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "./TestUtils.js";

registerTestSuite(
  createPublishedEntityTestSuite({
    before: async () => {
      const server = (
        await initializeIntegrationTestServer(
          "databases/integration-test-published-entity.sqlite"
        )
      ).valueOrThrow();
      const sessionResult = await server.createSession({
        provider: "test",
        identifier: "id",
        defaultAuthKeys: ["none"],
      });
      const { context } = sessionResult.valueOrThrow();

      const readOnlyEntityRepository = (
        await createReadOnlyEntityRepository(server)
      ).valueOrThrow();

      const adminClient = server.createAdminClient(context);
      const publishedClient = server.createPublishedClient(context);

      return [
        { server, adminClient, publishedClient, readOnlyEntityRepository },
        { server },
      ];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  })
);
