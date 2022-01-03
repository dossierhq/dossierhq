import type { Server } from "@jonasb/datadata-server";
import {
  createAdminEntityTestSuite,
} from "@jonasb/datadata-database-adapter-test-integration";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "./TestUtils.ts";

registerTestSuite(createAdminEntityTestSuite({
  before: async () => {
    const serverResult = await initializeIntegrationTestServer();
    if (serverResult.isError()) throw serverResult.toError();
    const server = serverResult.value;
    const client = server.createAdminClient(() =>
      server.createSession({
        provider: "test",
        identifier: "id",
        defaultAuthKeys: ["none"],
      })
    );

    return [{ client }, { server }];
  },
  after: async ({ server }: { server: Server }) => {
    await server.shutdown();
  },
}));
