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
    const server = (await createServer({
      databaseAdapter: createDotenvAdapter(),
      authorizationAdapter: createTestAuthorizationAdapter(),
    })).valueOrThrow();
    return [{ server }, { server }];
  },
  after: async ({ server }: { server: Server }) => {
    await server.shutdown();
  },
}));
