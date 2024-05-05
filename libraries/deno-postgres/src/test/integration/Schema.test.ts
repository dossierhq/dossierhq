import {
  createSchemaTestSuite,
  createSharedDossierClientProvider,
} from "@dossierhq/integration-test";
import type { Server } from "@dossierhq/server";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "../TestUtils.ts";

registerTestSuite(
  createSchemaTestSuite({
    before: async () => {
      const serverInit = (
        await initializeIntegrationTestServer()
      ).valueOrThrow();
      const { server } = serverInit;
      return [
        { server, clientProvider: createSharedDossierClientProvider(server) },
        serverInit,
      ];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  }),
);
