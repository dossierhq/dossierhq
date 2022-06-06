import type {
  ErrorResult,
  ErrorType,
  Logger,
  PublishedClient,
  PublishedSchema,
} from '@jonasb/datadata-core';
import { createContext } from 'react';
import type { DisplayAuthKey } from '../../shared/types/DisplayAuthKey.js';

export interface PublishedDataDataContextValue {
  publishedClient: PublishedClient;
  logger: Logger;
  schema: PublishedSchema | undefined;
  schemaError: ErrorResult<unknown, typeof ErrorType.Generic> | undefined;
  authKeys: DisplayAuthKey[];
}

export const PublishedDataDataContext = createContext<PublishedDataDataContextValue>({
  placeholderContextValue: true,
} as unknown as PublishedDataDataContextValue);
PublishedDataDataContext.displayName = 'PublishedDataDataContext';
