import { Server } from "@jonasb/datadata-server";
import { createAuthTestSuite } from "@jonasb/datadata-database-adapter-test-integration";
import { createDotenvAdapter } from "../ServerUtils.ts";
import { registerTestSuite } from "./TestUtils.ts";

registerTestSuite(createAuthTestSuite({
  before: () => {
    const server = new Server({ databaseAdapter: createDotenvAdapter() });
    const authContext = server.createAuthContext();
    return [authContext, server];
  },
  after: async (server: Server) => {
    await server.shutdown();
  },
}));
