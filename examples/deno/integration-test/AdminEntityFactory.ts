import type { Server } from "@jonasb/datadata-server";
import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
} from "@jonasb/datadata-database-adapter-test-integration";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "./TestUtils.ts";

export function registerAdminEntityTestSuite(suitePage: {
  page: number;
  totalPages: number;
}) {
  const testSuite = createAdminEntityTestSuite({
    before: async () => {
      const server = (await initializeIntegrationTestServer()).valueOrThrow();

      const sessionResult = server.createSession({
        provider: "test",
        identifier: "id",
        defaultAuthKeys: ["none"],
      });
      const client = server.createAdminClient(() => sessionResult);

      const readOnlyEntityRepository = (
        await createReadOnlyEntityRepository(server)
      ).valueOrThrow();

      //TODO remove client
      return [{ server, client, readOnlyEntityRepository }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  });

  registerTestSuite(testSuite, suitePage);
}
