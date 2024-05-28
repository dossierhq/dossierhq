import { Button } from '@/components/ui/button';
import { createConsoleLogger } from '@dossierhq/core';
import { BackgroundEntityProcessorPlugin, createServer } from '@dossierhq/server';
import { createSqlJsAdapter } from '@dossierhq/sql.js';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useEffect, useState } from 'react';
import type { Database, SqlJsStatic } from 'sql.js';
import initSqlJs from 'sql.js/dist/sql-wasm';
import sqlJsWasm from 'sql.js/dist/sql-wasm.wasm?url';

function Placeholder({ onClick }: { onClick: () => void }) {
  const [_init, setInit] = useState<{ db: Database } | null>(null);

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

      setInit({ db });
    })();
  }, []);

  return (
    <div>
      <Button onClick={onClick}>Placeholder</Button>
    </div>
  );
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
