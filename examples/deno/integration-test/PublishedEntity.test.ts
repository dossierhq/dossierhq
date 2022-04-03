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
  }),
);
