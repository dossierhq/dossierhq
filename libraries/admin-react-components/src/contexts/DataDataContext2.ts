import type {
  AdminClient,
  ErrorResult,
  ErrorType,
  FieldSpecification,
  Logger,
  PublishedClient,
  Schema,
} from '@jonasb/datadata-core';
import { createContext } from 'react';
import type { EditorJsToolSettings } from '..';

export interface DataDataContextAdapter {
  getEditorJSConfig(
    fieldSpec: FieldSpecification,
    standardBlockTools: { [toolName: string]: EditorJsToolSettings },
    standardInlineTools: string[]
  ): { tools: { [toolName: string]: EditorJsToolSettings }; inlineToolbar: string[] };
}

export interface DataDataContextValue2 {
  adapter: DataDataContextAdapter;
  adminClient: AdminClient;
  publishedClient: PublishedClient;
  logger: Logger;
  schema: Schema | undefined;
  schemaError: ErrorResult<unknown, ErrorType.Generic> | undefined;
}

export const DataDataContext2 = createContext<DataDataContextValue2>({
  placeholderContextValue: true,
} as unknown as DataDataContextValue2);
DataDataContext2.displayName = 'DataDataContext2';
