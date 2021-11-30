import type {
  ErrorResult,
  ErrorType,
  Logger,
  PublishedClient,
  Schema,
} from '@jonasb/datadata-core';
import { createContext } from 'react';
import type { DisplayAuthKey } from '../..';

export interface PublishedDataDataContextValue {
  publishedClient: PublishedClient;
  logger: Logger;
  schema: Schema | undefined;
  schemaError: ErrorResult<unknown, ErrorType.Generic> | undefined;
  authKeys: DisplayAuthKey[];
}

export const PublishedDataDataContext = createContext<PublishedDataDataContextValue>({
  placeholderContextValue: true,
} as unknown as PublishedDataDataContextValue);
PublishedDataDataContext.displayName = 'PublishedDataDataContext';
