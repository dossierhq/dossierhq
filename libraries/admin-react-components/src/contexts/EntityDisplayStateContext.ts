import { createContext } from 'react';
import type { EntityDisplayState } from '../reducers/EntityDisplayReducer/EntityDisplayReducer.js';

export const EntityDisplayStateContext = createContext<EntityDisplayState>({
  defaultContextValue: true,
} as unknown as EntityDisplayState);
EntityDisplayStateContext.displayName = 'EntityDisplayStateContext';
