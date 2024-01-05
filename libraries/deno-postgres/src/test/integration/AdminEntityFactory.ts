import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
  createSharedClientProvider,
} from "@dossierhq/integration-test";
import type { Server } from "@dossierhq/server";
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
      const { adminSchema, server } = (
        await initializeIntegrationTestServer()
      ).valueOrThrow();
      const readOnlyEntityRepository = (
        await createReadOnlyEntityRepository(server)
      ).valueOrThrow();

      return [
        {
          adminSchema,
          clientProvider: createSharedClientProvider(server),
          server,
          readOnlyEntityRepository,
        },
        { server },
      ];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  });

  registerTestSuite(testSuite, suitePage);
}
