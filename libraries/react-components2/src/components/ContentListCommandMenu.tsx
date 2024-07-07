import type { Schema } from '@dossierhq/core';
import { LaptopIcon, MoonIcon, SunIcon } from 'lucide-react';
import { type Dispatch } from 'react';
import { useOpenCommandMenu } from '../hooks/useOpenCommandMenu.js';
import { useSchema } from '../hooks/useSchema.js';
import {
  CommandMenuState_CloseAction,
  CommandMenuState_ClosePageAction,
  CommandMenuState_OpenPageAction,
  CommandMenuState_ToggleShowAction,
  CommandMenuState_UpdateSearchAction,
  type CommandMenuAction,
  type CommandMenuConfig,
  type CommandMenuState,
} from '../reducers/CommandReducer.js';
import type { ContentListState, ContentListStateAction } from '../reducers/ContentListReducer.js';
import { useTheme } from './ThemeProvider.js';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command.js';

export type ContentListCommandMenuPage = { id: 'root' } | { id: 'create' };

type ContentListCommandMenuAlert = never;

export type ContentListCommandMenuConfig = CommandMenuConfig<
  ContentListCommandMenuPage,
  ContentListCommandMenuAlert
>;

export type ContentListCommandMenuState = CommandMenuState<ContentListCommandMenuConfig>;

export type ContentListCommandMenuAction = CommandMenuAction<ContentListCommandMenuConfig>;

export function ContentListCommandMenu({
  state,
  dispatch,
  contentListState: _1,
  dispatchContentList: _2,
  onOpenEntity: _3,
  onCreateEntity,
}: {
  state: Readonly<ContentListCommandMenuState>;
  dispatch: Dispatch<ContentListCommandMenuAction>;
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
  onOpenEntity: (id: string) => void;
  onCreateEntity: (type: string) => void;
}) {
  useOpenCommandMenu(dispatch);
  const { schema } = useSchema();

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
                Create entity
              </CommandItem>
            </CommandGroup>
            <GenericCommands dispatch={dispatch} />
          </>
        )}
        {state.currentPage?.id === 'create' && (
          <CreateEntityCommandGroup {...{ schema, dispatch, onCreateEntity }} />
        )}
      </CommandList>
    </CommandDialog>
  );
}

function CreateEntityCommandGroup({
  schema,
  dispatch,
  onCreateEntity,
}: {
  schema: Schema | undefined;
  dispatch: Dispatch<ContentListCommandMenuAction>;
  onCreateEntity: (type: string) => void;
}) {
  return (
    <CommandGroup heading="Create entity">
      {schema?.spec.entityTypes.map((entityType) => (
        <CommandItem
          key={entityType.name}
          onSelect={() => {
            onCreateEntity(entityType.name);
            dispatch(new CommandMenuState_ToggleShowAction(false));
          }}
        >
          {entityType.name}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

function GenericCommands<TConfig extends CommandMenuConfig<unknown, unknown>>({
  dispatch,
}: {
  dispatch: Dispatch<CommandMenuAction<TConfig>>;
}) {
  const { setTheme } = useTheme();
  return (
    <CommandGroup heading="Theme">
      <CommandItem
        onSelect={() => {
          setTheme('light');
          dispatch(new CommandMenuState_CloseAction());
        }}
      >
        <SunIcon className="mr-2 h-4 w-4" />
        <span>Light</span>
      </CommandItem>
      <CommandItem
        onSelect={() => {
          setTheme('dark');
          dispatch(new CommandMenuState_CloseAction());
        }}
      >
        <MoonIcon className="mr-2 h-4 w-4" />
        <span>Dark</span>
      </CommandItem>
      <CommandItem
        onSelect={() => {
          setTheme('system');
          dispatch(new CommandMenuState_CloseAction());
        }}
      >
        <LaptopIcon className="mr-2 h-4 w-4" />
        <span>System</span>
      </CommandItem>
    </CommandGroup>
  );
}
