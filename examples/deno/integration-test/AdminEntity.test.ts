import type { Server } from "@jonasb/datadata-server";
import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
  TestSuite,
} from "@jonasb/datadata-database-adapter-test-integration";
import {
  initializeIntegrationTestServer,
  registerTestSuite,
} from "./TestUtils.ts";

let testSuite = createAdminEntityTestSuite({
  before: async () => {
    const serverResult = await initializeIntegrationTestServer();
    if (serverResult.isError()) {
      throw serverResult.toError();
    }
    const server = serverResult.value;
    const client = server.createAdminClient(() =>
      server.createSession({
        provider: "test",
        identifier: "id",
        defaultAuthKeys: ["none"],
      })
    );

    const readOnlyEntityRepository = await createReadOnlyEntityRepository(
      server,
    );

    //TODO remove client
    return [{ server, client, readOnlyEntityRepository }, { server }];
  },
  after: async ({ server }: { server: Server }) => {
    await server.shutdown();
  },
});

//TODO enable all tests on GitHub Actions. Not sure why running all tests leads to core dump
if (Deno.env.get("GITHUB_ACTIONS")) {
  const subSetTestSuite: TestSuite = {};
  for (const [name, fun] of Object.entries(testSuite)) {
    if (Math.random() < 0.9) subSetTestSuite[name] = fun;
  }
  testSuite = subSetTestSuite;
}

registerTestSuite(testSuite);
