import { useContext, type Dispatch } from 'react';
import { EntityEditorDispatchContext } from '../contexts/EntityEditorDispatchContext.js';
import { EntityEditorStateContext } from '../contexts/EntityEditorStateContext.js';
import { useOpenCommandMenu } from '../hooks/useOpenCommandMenu.js';
import {
  CommandMenuState_CloseAction,
  CommandMenuState_ClosePageAction,
  CommandMenuState_OpenPageAction,
  CommandMenuState_ToggleShowAction,
  CommandMenuState_UpdateSearchAction,
  type CommandMenuAction,
  type CommandMenuState,
} from '../reducers/CommandReducer.js';
import { EntityEditorActions } from '../reducers/EntityEditorReducer.js';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command.js';

export type ContentEditorCommandMenuPage = { id: 'root' } | { id: 'create' };

export function ContentEditorCommandMenu({
  state,
  dispatch,
}: {
  state: Readonly<CommandMenuState<ContentEditorCommandMenuPage>>;
  dispatch: Dispatch<CommandMenuAction<ContentEditorCommandMenuPage>>;
}) {
  // const { setTheme } = useTheme();
  const { schema } = useContext(EntityEditorStateContext);
  const dispatchEntityEditor = useContext(EntityEditorDispatchContext);

  useOpenCommandMenu(dispatch);

  return (
    <CommandDialog
      open={!!state.currentPage}
      onOpenChange={(open) => dispatch(new CommandMenuState_ToggleShowAction(open))}
      onKeyDown={(e) => {
        // Escape goes to previous page
        //TODO should escape close the menu?
        // Backspace goes to previous page when search is empty
        if (e.key === 'Escape' || (e.key === 'Backspace' && !state.search)) {
          e.preventDefault();
          if (state.pages.length === 0) {
            dispatch(new CommandMenuState_CloseAction());
          } else {
            dispatch(new CommandMenuState_ClosePageAction());
          }
        }
      }}
    >
      <CommandInput
        placeholder="Type a command or search..."
        value={state.search}
        onValueChange={(search) => dispatch(new CommandMenuState_UpdateSearchAction(search))}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {state.currentPage?.id === 'root' && (
          <>
            <CommandGroup heading="Suggestions">
              <CommandItem
                onSelect={() => dispatch(new CommandMenuState_OpenPageAction({ id: 'create' }))}
              >
                Create entity...
              </CommandItem>
            </CommandGroup>
            {/* <CommandGroup heading="Theme">
              <CommandItem
                onSelect={() => {
                  setTheme('light');
                  dispatch(new CommandMenuState_CloseAction());
                }}
              >
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setTheme('dark');
                  dispatch(new CommandMenuState_CloseAction());
                }}
              >
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setTheme('system');
                  dispatch(new CommandMenuState_CloseAction());
                }}
              >
                <Laptop className="mr-2 h-4 w-4" />
                <span>System</span>
              </CommandItem>
            </CommandGroup> */}
          </>
        )}
        {state.currentPage?.id === 'create' && (
          <CommandGroup heading="Create entity">
            {schema?.spec.entityTypes.map((entityType) => (
              <CommandItem
                key={entityType.name}
                onSelect={() => {
                  dispatchEntityEditor(
                    new EntityEditorActions.AddDraft({
                      id: crypto.randomUUID(),
                      newType: entityType.name,
                    }),
                  );
                  dispatch(new CommandMenuState_ToggleShowAction(false));
                }}
              >
                {entityType.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
