import type {
  ErrorResult,
  ErrorType,
  Logger,
  PublishedClient,
  PublishedSchema,
  ValueItem,
} from '@jonasb/datadata-core';
import { createContext } from 'react';
import type { FieldDisplayProps } from '../../components/EntityDisplay/FieldDisplay.js';
import type { DisplayAuthKey } from '../../shared/types/DisplayAuthKey.js';

export interface RichTextValueItemDisplayProps {
  value: ValueItem;
}

export interface PublishedDataDataContextAdapter {
  renderPublishedFieldDisplay(props: FieldDisplayProps<unknown>): JSX.Element | null;
  renderPublishedRichTextValueItemDisplay(props: RichTextValueItemDisplayProps): JSX.Element | null;
}

export interface PublishedDataDataContextValue {
  adapter: PublishedDataDataContextAdapter;
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
