import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
  createSharedDossierClientProvider,
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
      const { server } = (
        await initializeIntegrationTestServer()
      ).valueOrThrow();
      const clientProvider = createSharedDossierClientProvider(server);
      const readOnlyEntityRepository = (
        await createReadOnlyEntityRepository(clientProvider)
      ).valueOrThrow();

      return [{ clientProvider, server, readOnlyEntityRepository }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  });

  registerTestSuite(testSuite, suitePage);
}
