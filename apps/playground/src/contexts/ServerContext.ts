import type { Server } from '@dossierhq/server';
import { createContext } from 'react';

export interface ServerContextValue {
  server: Server | null;
  error: boolean;
}

export const ServerContext = createContext<ServerContextValue>({ server: null, error: false });
