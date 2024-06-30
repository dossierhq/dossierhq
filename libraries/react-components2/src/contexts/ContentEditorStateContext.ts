import { createContext } from 'react';
import type { ContentEditorState } from '../reducers/ContentEditorReducer.js';

export const ContentEditorStateContext = createContext<ContentEditorState>({
  defaultContextValue: true,
} as unknown as ContentEditorState);
ContentEditorStateContext.displayName = 'ContentEditorStateContext';
