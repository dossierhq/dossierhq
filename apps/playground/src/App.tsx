import { useContext, useEffect } from "react";
import { ServerProvider } from "./components/ServerProvider";
import { ServerContext } from "./contexts/ServerContext";
import { createConsoleLogger } from "@jonasb/datadata-core";
import { Button, FullscreenContainer } from "@jonasb/datadata-design";

function App() {
  return (
    <ServerProvider>
      <AppContent />
    </ServerProvider>
  );
}

function AppContent() {
  const { server, error } = useContext(ServerContext);

  useEffect(() => {
    (async () => {
      if (!server) return;
      const adminClient = server.createAdminClient(() =>
        server.createSession({
          provider: "sys",
          identifier: "test",
          defaultAuthKeys: ["none", "subject"],
          logger: createConsoleLogger(console),
        })
      );
      const schemaResult = await adminClient.updateSchemaSpecification({
        entityTypes: [
          { name: "TitleOnly", fields: [{ name: "title", type: "String" }] },
        ],
      });
      console.log("Created schema", schemaResult.valueOrThrow());
      const createResult = await adminClient.createEntity({
        info: { type: "TitleOnly", name: "Hello world", authKey: "none" },
        fields: { title: "Hello world" },
      });
      console.log("Created entity", createResult.valueOrThrow());
      const totalCount = await adminClient.getTotalCount();
      console.log("COUNT", totalCount.valueOrThrow());
    })();
  }, [server]);

  return (
    <FullscreenContainer>
      <FullscreenContainer.Row>
        server: {server ? "initialized" : ""}, error: {error}
      </FullscreenContainer.Row>
    </FullscreenContainer>
  );
}

export default App;
