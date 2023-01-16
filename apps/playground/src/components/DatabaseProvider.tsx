import { BeforeUnload } from '@dossierhq/design';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Database, SqlJsStatic } from 'sql.js';
import initSqlJs from 'sql.js/dist/sql-wasm';
import sqlJsWasm from 'sql.js/dist/sql-wasm.wasm?url';
import { DatabaseContext } from '../contexts/DatabaseContext';

interface Props {
  children: ReactNode;
}

let sqlPromise: Promise<SqlJsStatic> | null = null;

export function DatabaseProvider({ children }: Props) {
  const [database, setDatabase] = useState<Database | null>(null);
  const startedInitialDatabase = useRef(false);

  const createDatabase = useCallback((data: Uint8Array | null) => {
    getSql().then((SQL) => setDatabase(new SQL.Database(data)));
  }, []);

  useEffect(() => {
    if (startedInitialDatabase.current) return;
    startedInitialDatabase.current = true;
    createDatabase(null);
  }, [createDatabase]);

  return (
    <DatabaseContext.Provider value={{ database, createDatabase }}>
      <BeforeUnload message="Leaving the page will delete the database" />
      {children}
    </DatabaseContext.Provider>
  );
}

async function getSql() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: (_file) => sqlJsWasm,
    });
  }
  return sqlPromise;
}
