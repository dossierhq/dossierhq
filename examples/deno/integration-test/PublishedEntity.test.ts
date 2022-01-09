import type { Server } from "@jonasb/datadata-server";
import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
} from "@jonasb/datadata-database-adapter-test-integration";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "./TestUtils.ts";

registerTestSuite(createPublishedEntityTestSuite({
  before: async () => {
    const serverResult = await initializeIntegrationTestServer();
    if (serverResult.isError()) throw serverResult.toError();
    const server = serverResult.value;
    const sessionResult = await server.createSession({
      provider: "test",
      identifier: "id",
      defaultAuthKeys: ["none"],
    });
    if (sessionResult.isError()) throw sessionResult.toError();
    const { context } = sessionResult.value;

    const readOnlyEntityRepository = await createReadOnlyEntityRepository(
      server,
    );

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
}));
