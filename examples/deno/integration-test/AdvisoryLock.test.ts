import type { Server } from "@jonasb/datadata-server";
import { createServer } from "@jonasb/datadata-server";
import {
  createAdvisoryLockTestSuite,
  createTestAuthorizationAdapter,
} from "@jonasb/datadata-database-adapter-test-integration";
import { createDotenvAdapter } from "../ServerUtils.ts";
import { registerTestSuite } from "./TestUtils.ts";

registerTestSuite(createAdvisoryLockTestSuite({
  before: async () => {
    const serverResult = await createServer({
      databaseAdapter: createDotenvAdapter(),
      authorizationAdapter: createTestAuthorizationAdapter(),
    });
    if (serverResult.isError()) throw serverResult.toError();
    const server = serverResult.value;
    return [{ server }, { server }];
  },
  after: async ({ server }: { server: Server }) => {
    await server.shutdown();
  },
}));
