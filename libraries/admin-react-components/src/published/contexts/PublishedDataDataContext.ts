import type {
  ErrorResult,
  ErrorType,
  Logger,
  PublishedClient,
  AdminSchema,
} from '@jonasb/datadata-core';
import { createContext } from 'react';

export interface PublishedDataDataContextValue {
  publishedClient: PublishedClient;
  logger: Logger;
  schema: AdminSchema | undefined;
  schemaError: ErrorResult<unknown, ErrorType.Generic> | undefined;
}

export const PublishedDataDataContext = createContext<PublishedDataDataContextValue>({
  placeholderContextValue: true,
} as unknown as PublishedDataDataContextValue);
PublishedDataDataContext.displayName = 'PublishedDataDataContext';
