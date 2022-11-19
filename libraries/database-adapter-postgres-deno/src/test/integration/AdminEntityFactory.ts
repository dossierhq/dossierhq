import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
} from "@jonasb/datadata-database-adapter-test-integration";
import type { Server } from "@jonasb/datadata-server";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "../TestUtils.ts";

export function registerAdminEntityTestSuite(suitePage: {
  page: number;
  totalPages: number;
}) {
  const testSuite = createAdminEntityTestSuite({
    before: async () => {
      const { adminSchema, server } = (await initializeIntegrationTestServer())
        .valueOrThrow();
      const readOnlyEntityRepository = (
        await createReadOnlyEntityRepository(server)
      ).valueOrThrow();

      return [{ adminSchema, server, readOnlyEntityRepository }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  });

  registerTestSuite(testSuite, suitePage);
}
