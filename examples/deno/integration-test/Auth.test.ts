import type { Server } from "@jonasb/datadata-server";
import { createServer } from "@jonasb/datadata-server";
import { createAuthTestSuite } from "@jonasb/datadata-database-adapter-test-integration";
import { createDotenvAdapter, createDummyLogger } from "../ServerUtils.ts";
import { registerTestSuite } from "./TestUtils.ts";

registerTestSuite(createAuthTestSuite({
  before: async () => {
    const serverResult = await createServer({
      databaseAdapter: createDotenvAdapter(),
      logger: createDummyLogger(),
    });
    if (serverResult.isError()) throw serverResult.toError();
    const server = serverResult.value;
    return [{ server }, { server }];
  },
  after: async ({ server }: { server: Server }) => {
    await server.shutdown();
  },
}));
