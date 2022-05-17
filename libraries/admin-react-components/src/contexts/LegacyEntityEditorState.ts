import type { Dispatch } from 'react';
import { createContext } from 'react';
import type {
  LegacyEntityEditorState,
  LegacyEntityEditorStateAction,
} from '../domain-components/LegacyEntityEditor/LegacyEntityEditorReducer';

export const LegacyEntityEditorStateContext = createContext<LegacyEntityEditorState>({
  defaultContextValue: true,
} as unknown as LegacyEntityEditorState);
LegacyEntityEditorStateContext.displayName = 'LegacyEntityEditorStateContext';

export const LegacyEntityEditorDispatchContext = createContext<
  Dispatch<LegacyEntityEditorStateAction>
>({
  defaultContextValue: true,
} as unknown as Dispatch<LegacyEntityEditorStateAction>);
LegacyEntityEditorDispatchContext.displayName = 'LegacyEntityEditorDispatchContext';
