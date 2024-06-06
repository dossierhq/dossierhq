import { createContext, type Dispatch } from 'react';
import type { EntityEditorStateAction } from '../reducers/EntityEditorReducer.js';

export const EntityEditorDispatchContext = createContext<Dispatch<EntityEditorStateAction>>({
  defaultContextValue: true,
} as unknown as Dispatch<EntityEditorStateAction>);
EntityEditorDispatchContext.displayName = 'EntityEditorDispatchContext';
