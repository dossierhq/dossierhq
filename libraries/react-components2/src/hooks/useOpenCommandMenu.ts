import { useEffect, type Dispatch } from 'react';
import {
  CommandMenuState_ToggleShowAction,
  type CommandMenuAction,
  type CommandMenuConfig,
} from '../reducers/CommandReducer.js';

export function useOpenCommandMenu<TConfig extends CommandMenuConfig<unknown, unknown>>(
  dispatch: Dispatch<CommandMenuAction<TConfig>> | undefined,
) {
  useEffect(() => {
    if (!dispatch) {
      return;
    }
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
