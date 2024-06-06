import { createContext } from 'react';
import type { EntityEditorState } from '../reducers/EntityEditorReducer.js';

export const EntityEditorStateContext = createContext<EntityEditorState>({
  defaultContextValue: true,
} as unknown as EntityEditorState);
EntityEditorStateContext.displayName = 'EntityEditorStateContext';
