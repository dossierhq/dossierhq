import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk } from '@jonasb/datadata-core';
import { createSqlJsAdapter } from '@jonasb/datadata-database-adapter-sqlite-sql.js';
import type { Server } from '@jonasb/datadata-server';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@jonasb/datadata-server';
import { useContext, useEffect, useState } from 'react';
import type { Database } from 'sql.js';
import { SERVER_LOGGER } from '../config/LoggerConfig';
import { DatabaseContext } from '../contexts/DatabaseContext';
import type { ServerContextValue } from '../contexts/ServerContext';
import { ServerContext } from '../contexts/ServerContext';

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
    const adapterResult = await createSqlJsAdapter({ logger: SERVER_LOGGER }, database);
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
