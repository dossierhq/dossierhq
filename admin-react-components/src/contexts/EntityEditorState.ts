import type { Dispatch } from 'react';
import { createContext } from 'react';
import type { EntityEditorState, EntityEditorStateAction } from '../..';

export const EntityEditorStateContext = createContext<EntityEditorState>(({
  defaultContextValue: true,
} as unknown) as EntityEditorState);
EntityEditorStateContext.displayName = 'EntityEditorStateContext';

export const EntityEditorDispatchContext = createContext<Dispatch<EntityEditorStateAction>>(({
  defaultContextValue: true,
} as unknown) as Dispatch<EntityEditorStateAction>);
EntityEditorDispatchContext.displayName = 'EntityEditorDispatchContext';
