import { useEffect, type Dispatch } from 'react';
import {
  CommandMenuState_ToggleShowAction,
  type CommandMenuAction,
} from '../reducers/CommandReducer.js';

export function useOpenCommandMenu<TPage, TAlert>(
  dispatch: Dispatch<CommandMenuAction<TPage, TAlert>>,
) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        dispatch(new CommandMenuState_ToggleShowAction());
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [dispatch]);
}