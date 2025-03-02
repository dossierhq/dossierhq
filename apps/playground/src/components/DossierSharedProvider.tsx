import {
  LoggingClientMiddleware,
  notOk,
  ok,
  type ClientContext,
  type DossierClientMiddleware,
  type ErrorType,
  type PromiseResult,
  type PublishedDossierClientMiddleware,
  type Result,
} from '@dossierhq/core';
import { NotificationContext } from '@dossierhq/design';
import {
  DossierProvider,
  PublishedDossierProvider,
  useCachingDossierMiddleware,
} from '@dossierhq/react-components';
import type { CreateSessionPayload, Server } from '@dossierhq/server';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSWRConfig, type Cache } from 'swr';
import { DISPLAY_AUTH_KEYS } from '../config/AuthConfig.js';
import { ContextAdapter } from '../config/ContextAdapter.js';
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
  const { showNotification } = useContext(NotificationContext);
  const { users, setCurrentUserId } = useContext(UserContext);

  const [sessionResult, setSessionResult] = useState<SessionResult>(uninitializedSession);
  const sessionResultRef = useRef<SessionResult>(sessionResult);
  sessionResultRef.current = sessionResult;

  const cachingAdminMiddleware = useCachingDossierMiddleware();

  const { cache, mutate } = useSWRConfig();
  const swrConfigRef = useRef({ cache, mutate });
  swrConfigRef.current = { cache, mutate };

  const login = useCallback(
    async (
      userId: string,
    ): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> => {
      assertIsDefined(server);
      const user = users.find((it) => it.id === userId);
      assertIsDefined(user);

      const result = await loginUser(
        server,
        userId,
        swrConfigRef.current.cache,
        swrConfigRef.current.mutate,
      );
      if (result.isError()) return result;

      setSessionResult(result);
      setCurrentUserId(userId);
      showNotification({ color: 'success', message: `Logged in as ${user.name}` });
      return ok(undefined);
    },
    [server, setCurrentUserId, showNotification, users],
  );

  useEffect(() => {
    if (server) {
      void login(users[0].id);
    }
  }, [login, server, users]);

  const args = useMemo(() => {
    if (!server) return null;

    const adapter = new ContextAdapter();
    const adminArgs = {
      client: server.createDossierClient(
        () => Promise.resolve(sessionResultRef.current),
        [LoggingClientMiddleware as DossierClientMiddleware<ClientContext>, cachingAdminMiddleware],
      ),
      adapter,
      authKeys: DISPLAY_AUTH_KEYS,
    };

    const publishedArgs = {
      adapter,
      publishedClient: server.createPublishedDossierClient(
        () => Promise.resolve(sessionResultRef.current),
        [LoggingClientMiddleware as PublishedDossierClientMiddleware<ClientContext>],
      ),
      authKeys: DISPLAY_AUTH_KEYS,
    };

    return { adminArgs, publishedArgs };
  }, [server, cachingAdminMiddleware]);

  if (!args || sessionResult === uninitializedSession) {
    return null;
  }
  return (
    <LoginContext.Provider value={login}>
      <DossierProvider {...args.adminArgs}>
        <PublishedDossierProvider {...args.publishedArgs}>{children}</PublishedDossierProvider>
      </DossierProvider>
    </LoginContext.Provider>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loginUser(server: Server, userId: string, cache: Cache<any>, mutate: ScopedMutator) {
  const result = await server.createSession({
    provider: 'sys',
    identifier: userId,
    defaultAuthKeys: DISPLAY_AUTH_KEYS.map((it) => it.authKey),
    logger: SESSION_LOGGER,
  });

  if (result.isError()) return result;

  //TODO add support to ARC for clearing cache?
  if (cache instanceof Map) {
    const mutators = [...cache.keys()].map((key) => mutate(key));
    await Promise.all(mutators);
  }

  return result;
}
