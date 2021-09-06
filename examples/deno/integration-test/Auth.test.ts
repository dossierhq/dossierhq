import type { Server2 } from "@jonasb/datadata-server";
import { createServer, Server } from "@jonasb/datadata-server";
import { createAuthTestSuite } from "@jonasb/datadata-database-adapter-test-integration";
import { createDotenvAdapter, createDummyLogger } from "../ServerUtils.ts";
import { registerTestSuite } from "./TestUtils.ts";

registerTestSuite(createAuthTestSuite({
  before: async () => {
    const server = new Server({ databaseAdapter: createDotenvAdapter() });
    const authContext = server.createAuthContext();
    const server2Result = await createServer({
      databaseAdapter: createDotenvAdapter(),
      logger: createDummyLogger(),
    });
    if (server2Result.isError()) throw server2Result.toError();
    const server2 = server2Result.value;
    return [{ authContext, server: server2 }, { server, server2 }];
  },
  after: async ({ server, server2 }: { server: Server; server2: Server2 }) => {
    await server.shutdown();
    await server2.shutdown();
  },
}));
