import type { Server } from "@jonasb/datadata-server";
import { createServer } from "@jonasb/datadata-server";
import {
  createSchemaTestSuite,
  createTestAuthorizationAdapter,
} from "@jonasb/datadata-database-adapter-test-integration";
import { createDotenvAdapter } from "../ServerUtils.ts";
import { registerTestSuite } from "./TestUtils.ts";

registerTestSuite(
  createSchemaTestSuite({
    before: async () => {
      const server = (
        await createServer({
          databaseAdapter: createDotenvAdapter(),
          authorizationAdapter: createTestAuthorizationAdapter(),
        })
      ).valueOrThrow();

      const sessionResult = server.createSession({
        provider: "test",
        identifier: "id",
        defaultAuthKeys: ["none"],
      });
      const client = server.createAdminClient(() => sessionResult);

      return [{ client }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  }),
);
