import { BeforeUnload, NotificationContext } from '@dossierhq/design';
import type { ReactNode } from 'react';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Database, SqlJsStatic } from 'sql.js';
import initSqlJs from 'sql.js/dist/sql-wasm';
import sqlJsWasm from 'sql.js/dist/sql-wasm.wasm?url';
import { ExampleConfigs } from '../config/ExamplesConfig.js';
import { DatabaseContext } from '../contexts/DatabaseContext';
import { createNewDatabase, loadDatabaseFromUrl } from '../utils/DatabaseUtils.js';
import { ROUTE } from '../utils/RouteUtils.js';

interface Props {
  children: ReactNode;
}

let sqlPromise: Promise<SqlJsStatic> | null = null;

export function DatabaseProvider({ children }: Props) {
  const { serverName } = useParams();
  const { showNotification } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [database, setDatabase] = useState<Database | null>(null);
  const startedLoadingDatabase = useRef(false);

  const createDatabase = useCallback(async (data: Uint8Array | null) => {
    startedLoadingDatabase.current = true; // set since this can be called from other components as well

    setDatabase(null);
    const SQL = await getSql();
    setDatabase(new SQL.Database(data));
  }, []);

  const clearDatabase = useCallback(() => {
    setDatabase(null);
  }, []);

  useEffect(() => {
    if (!serverName) return;
    if (startedLoadingDatabase.current) return;
    startedLoadingDatabase.current = true;

    if (database) {
      return;
    }

    const config = ExampleConfigs.find((it) => it.name === serverName);
    if (serverName === 'new') {
      createNewDatabase(createDatabase, showNotification);
    } else if (serverName === 'upload') {
      showNotification({
        color: 'error',
        message: 'Your uploaded database is lost due to refreshed browser tab',
      });
      navigate(ROUTE.index.url);
    } else if (config) {
      loadDatabaseFromUrl(config.url, createDatabase, showNotification);
    }
  }, [createDatabase, database, navigate, serverName, showNotification]);

  const value = useMemo(
    () => ({ database, createDatabase, clearDatabase }),
    [database, createDatabase, clearDatabase]
  );

  return (
    <DatabaseContext.Provider value={value}>
      {database !== null ? (
        <BeforeUnload message="Leaving the page will delete the database" />
      ) : null}
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
