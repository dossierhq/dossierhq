import { DossierProvider } from '@/components/DossierProvider.js';
import { Button } from '@/components/ui/button';
import { DossierContext } from '@/contexts/DossierContext.js';
import { createConsoleLogger, type DossierClient } from '@dossierhq/core';
import { BackgroundEntityProcessorPlugin, createServer } from '@dossierhq/server';
import { createSqlJsAdapter } from '@dossierhq/sql.js';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useContext, useEffect, useState } from 'react';
import type { Database, SqlJsStatic } from 'sql.js';
import initSqlJs from 'sql.js/dist/sql-wasm';
import sqlJsWasm from 'sql.js/dist/sql-wasm.wasm?url';

function Placeholder({ onClick }: { onClick: () => void }) {
  const [init, setInit] = useState<{ db: Database; client: DossierClient } | null>(null);

  useEffect(() => {
    (async () => {
      const SQL = await getSql();
      const db = new SQL.Database();
      const logger = createConsoleLogger(console);

      const databaseAdapter = (
        await createSqlJsAdapter({ logger }, db, {
          migrate: true,
          fts: { version: 'fts4' },
          journalMode: 'memory',
        })
      ).valueOrThrow();
      const server = (await createServer({ databaseAdapter })).valueOrThrow();

      const processorPlugin = new BackgroundEntityProcessorPlugin(server, logger);
      server.addPlugin(processorPlugin);
      processorPlugin.start();

      const session = (
        await server.createSession({ provider: 'sys', identifier: 'user1' })
      ).valueOrThrow();
      const client = server.createDossierClient(session.context);

      setInit({ db, client });
    })();
  }, []);

  if (!init) {
    return null;
  }

  return (
    <DossierProvider client={init.client}>
      <div>
        <Button onClick={onClick}>Placeholder</Button>
        <Inner />
      </div>
    </DossierProvider>
  );
}

function Inner() {
  const context = useContext(DossierContext);
  return <div>{JSON.stringify(context.schema)}</div>;
}

let sqlPromise: Promise<SqlJsStatic> | null = null;
async function getSql() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: (_file) => sqlJsWasm,
    });
  }
  return sqlPromise;
}

const meta = {
  title: 'Placeholder',
  component: Placeholder,
  args: { onClick: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Placeholder>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
