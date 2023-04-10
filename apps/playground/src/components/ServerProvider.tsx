import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { NoneAndSubjectAuthorizationAdapter, createServer } from '@dossierhq/server';
import { createSqlJsAdapter } from '@dossierhq/sql.js';
import { useContext, useEffect, useState } from 'react';
import type { Database } from 'sql.js';
import { SERVER_LOGGER } from '../config/LoggerConfig.js';
import { DatabaseContext } from '../contexts/DatabaseContext.js';
import type { ServerContextValue } from '../contexts/ServerContext.js';
import { ServerContext } from '../contexts/ServerContext.js';

interface Props {
  children: React.ReactNode;
}

export function ServerProvider({ children }: Props) {
  const { database } = useContext(DatabaseContext);
  const [value, setValue] = useState<ServerContextValue>({
    server: null,
    error: false,
  });

  useEffect(() => {
    if (!database) {
      setValue({ server: null, error: false });
    } else {
      initializeServer(database).then((result) => {
        if (result.isOk()) {
          setValue({ server: result.value, error: false });
        } else {
          setValue({ server: null, error: true });
        }
      });
    }
  }, [database]);

  return <ServerContext.Provider value={value}>{children}</ServerContext.Provider>;
}

async function initializeServer(
  database: Database
): PromiseResult<Server, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  try {
    const adapterResult = await createSqlJsAdapter({ logger: SERVER_LOGGER }, database, {
      migrate: true,
      fts: { version: 'fts4' },
      journalMode: 'memory',
    });
    if (adapterResult.isError()) return adapterResult;

    const serverResult = await createServer({
      databaseAdapter: adapterResult.value,
      authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
      logger: SERVER_LOGGER,
    });
    return serverResult;
  } catch (error) {
    return notOk.GenericUnexpectedException({ logger: SERVER_LOGGER }, error);
  }
}
