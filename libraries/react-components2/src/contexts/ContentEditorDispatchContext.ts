import { createContext, type Dispatch } from 'react';
import type { ContentEditorStateAction } from '../reducers/ContentEditorReducer.js';

export const ContentEditorDispatchContext = createContext<Dispatch<ContentEditorStateAction>>({
  defaultContextValue: true,
} as unknown as Dispatch<ContentEditorStateAction>);
ContentEditorDispatchContext.displayName = 'ContentEditorDispatchContext';
