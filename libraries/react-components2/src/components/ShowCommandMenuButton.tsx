import { TerminalIcon } from 'lucide-react';
import type { Dispatch } from 'react';
import {
  CommandMenuState_ShowAction,
  type CommandMenuAction,
  type CommandMenuConfig,
} from '../reducers/CommandReducer.js';
import { Button } from './ui/button.js';

interface Props<TConfig extends CommandMenuConfig<unknown, unknown>> {
  className?: string;
  dispatchCommandMenu: Dispatch<CommandMenuAction<TConfig>>;
}

export function ShowCommandMenuButton<TConfig extends CommandMenuConfig<unknown, unknown>>({
  className,
  dispatchCommandMenu,
}: Props<TConfig>) {
  return (
    <Button
      className={className}
      variant="outline"
      title="Show command menu"
      onClick={() => dispatchCommandMenu(new CommandMenuState_ShowAction([{ id: 'root' }]))}
    >
      <TerminalIcon className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
