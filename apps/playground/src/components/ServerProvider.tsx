import { ErrorType, notOk, PromiseResult } from '@jonasb/datadata-core';
import { createSqlJsAdapter } from '@jonasb/datadata-database-adapter-sqlite-sql.js';
import { createServer, NoneAndSubjectAuthorizationAdapter, Server } from '@jonasb/datadata-server';
import { useEffect, useState } from 'react';
import initSqlJs from 'sql.js/dist/sql-wasm-debug';
import { SERVER_LOGGER } from '../config/LoggerConfig';
import { ServerContext, ServerContextValue } from '../contexts/ServerContext';

interface Props {
  children: React.ReactNode;
}

export function ServerProvider({ children }: Props) {
  const [value, setValue] = useState<ServerContextValue>({
    server: null,
    error: false,
  });

  useEffect(() => {
    initializeServer().then((result) => {
      if (result.isOk()) {
        setValue({ server: result.value, error: false });
      } else {
        setValue({ server: null, error: true });
      }
    });
  }, []);

  return <ServerContext.Provider value={value}>{children}</ServerContext.Provider>;
}

async function initializeServer(): PromiseResult<Server, ErrorType.BadRequest | ErrorType.Generic> {
  try {
    //TODO use version from node_modules
    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    });
    const database = new SQL.Database();
    const adapterResult = await createSqlJsAdapter({ logger: SERVER_LOGGER }, database);
    if (adapterResult.isError()) return adapterResult;

    const serverResult = await createServer({
      databaseAdapter: adapterResult.value,
      authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
    });
    if (serverResult.isError()) return serverResult;
    const server = serverResult.value;

    const adminClient = server.createAdminClient(() =>
      server.createSession({
        provider: 'sys',
        identifier: 'johndoe',
        defaultAuthKeys: [],
      })
    );
    const schemaResult = await adminClient.updateSchemaSpecification({
      entityTypes: [{ name: 'TitleOnly', fields: [{ name: 'title', type: 'String' }] }],
    });
    if (schemaResult.isError()) return schemaResult;

    return serverResult;
  } catch (error) {
    return notOk.GenericUnexpectedException({ logger: SERVER_LOGGER }, error);
  }
}
