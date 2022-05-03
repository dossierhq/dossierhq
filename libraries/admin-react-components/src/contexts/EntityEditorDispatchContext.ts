import type { Dispatch } from 'react';
import { createContext } from 'react';
import type { EntityEditorStateAction } from '../reducers/EntityEditorReducer/EntityEditorReducer';

export const EntityEditorDispatchContext = createContext<Dispatch<EntityEditorStateAction>>({
  defaultContextValue: true,
} as unknown as Dispatch<EntityEditorStateAction>);
EntityEditorDispatchContext.displayName = 'EntityEditorDispatchContext';
