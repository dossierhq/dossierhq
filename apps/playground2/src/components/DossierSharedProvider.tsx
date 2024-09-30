import {
  LoggingClientMiddleware,
  notOk,
  ok,
  type ClientContext,
  type DossierClientMiddleware,
  type ErrorType,
  type PromiseResult,
  type Result,
} from '@dossierhq/core';
import { DossierProvider, useCachingDossierMiddleware } from '@dossierhq/react-components2';
import type { CreateSessionPayload, Server } from '@dossierhq/server';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSWRConfig, type Cache } from 'swr';
import { SESSION_LOGGER } from '../config/LoggerConfig.js';
import { LoginContext } from '../contexts/LoginContext.js';
import { ServerContext } from '../contexts/ServerContext.js';
import { UserContext } from '../contexts/UserContext.js';
import { assertIsDefined } from '../utils/AssertUtils.js';

type ScopedMutator = ReturnType<typeof useSWRConfig>['mutate'];

type SessionResult = Result<
  CreateSessionPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
>;

const uninitializedSession = notOk.Generic('Uninitialized user');

export function DossierSharedProvider({ children }: { children: React.ReactNode }) {
  const { server } = useContext(ServerContext);
  const { users, setCurrentUserId } = useContext(UserContext);

  const [sessionResult, setSessionResult] = useState<SessionResult>(uninitializedSession);

  const cachingMiddleware = useCachingDossierMiddleware();

  const { cache, mutate } = useSWRConfig();

  const login = useCallback(
    async (
      userId: string,
    ): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> => {
      assertIsDefined(server);
      const user = users.find((it) => it.id === userId);
      assertIsDefined(user);

      const result = await loginUser(server, userId, cache, mutate);
      if (result.isError()) return result;

      setSessionResult(result);
      setCurrentUserId(userId);
      //TODO showNotification({ color: 'success', message: `Logged in as ${user.name}` });
      return ok(undefined);
    },
    [cache, mutate, server, setCurrentUserId, users],
  );

  useEffect(() => {
    if (server) {
      void login(users[0].id);
    }
  }, [login, server, users]);

  const args = useMemo(() => {
    if (!server) return null;

    const dossierArgs = {
      client: server.createDossierClient(
        () => Promise.resolve(sessionResult),
        [LoggingClientMiddleware as DossierClientMiddleware<ClientContext>, cachingMiddleware],
      ),
    };

    return { dossierArgs };
  }, [server, cachingMiddleware, sessionResult]);

  if (!args || sessionResult === uninitializedSession) {
    return null;
  }
  return (
    <LoginContext.Provider value={login}>
      <DossierProvider {...args.dossierArgs}>{children}</DossierProvider>
    </LoginContext.Provider>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loginUser(server: Server, userId: string, cache: Cache<any>, mutate: ScopedMutator) {
  const result = await server.createSession({
    provider: 'sys',
    identifier: userId,
    logger: SESSION_LOGGER,
  });

  if (result.isError()) return result;

  //TODO add support to react-components for clearing cache?
  if (cache instanceof Map) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const mutators = [...cache.keys()].map((key) => mutate(key));
    await Promise.all(mutators);
  }

  return result;
}
