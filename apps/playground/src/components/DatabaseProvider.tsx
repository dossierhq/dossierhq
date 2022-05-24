import { BeforeUnload } from '@jonasb/datadata-design';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Database, SqlJsStatic } from 'sql.js';
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

  const createDatabase = useCallback(() => {
    getSql().then((SQL) => setDatabase(new SQL.Database()));
  }, []);

  useEffect(() => {
    if (startedInitialDatabase.current) return;
    startedInitialDatabase.current = true;
    createDatabase();
  }, []);

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
