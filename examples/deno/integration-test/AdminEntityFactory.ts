import type { Server } from "@jonasb/datadata-server";
import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
} from "@jonasb/datadata-database-adapter-test-integration";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "./TestUtils.ts";

export function registerAdminEntityTestSuite(
  suitePage: { page: number; totalPages: number },
) {
  const testSuite = createAdminEntityTestSuite({
    before: async () => {
      const serverResult = await initializeIntegrationTestServer();
      if (serverResult.isError()) {
        throw serverResult.toError();
      }
      const server = serverResult.value;
      const client = server.createAdminClient(() =>
        server.createSession({
          provider: "test",
          identifier: "id",
          defaultAuthKeys: ["none"],
        })
      );

      const readOnlyEntityRepository = await createReadOnlyEntityRepository(
        server,
      );

      //TODO remove client
      return [{ server, client, readOnlyEntityRepository }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  });

  registerTestSuite(testSuite, suitePage);
}
