import type { Dispatch } from 'react';
import { createContext } from 'react';
import type { EntityDisplayStateAction } from '../reducers/EntityDisplayReducer/EntityDisplayReducer.js';

export const EntityDisplayDispatchContext = createContext<Dispatch<EntityDisplayStateAction>>({
  defaultContextValue: true,
} as unknown as Dispatch<EntityDisplayStateAction>);
EntityDisplayDispatchContext.displayName = 'EntityDisplayDispatchContext';
