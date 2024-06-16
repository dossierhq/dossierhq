import type { Schema } from '@dossierhq/core';
import { LaptopIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useContext, type Dispatch } from 'react';
import { EntityEditorDispatchContext } from '../contexts/EntityEditorDispatchContext.js';
import { EntityEditorStateContext } from '../contexts/EntityEditorStateContext.js';
import { useOpenCommandMenu } from '../hooks/useOpenCommandMenu.js';
import {
  CommandMenuState_CloseAction,
  CommandMenuState_CloseAlertAction,
  CommandMenuState_ClosePageAction,
  CommandMenuState_OpenPageAction,
  CommandMenuState_ShowAlertAction,
  CommandMenuState_ToggleShowAction,
  CommandMenuState_UpdateSearchAction,
  type CommandMenuAction,
  type CommandMenuState,
} from '../reducers/CommandReducer.js';
import {
  EntityEditorActions,
  type EntityEditorDraftState,
  type EntityEditorStateAction,
} from '../reducers/EntityEditorReducer.js';
import { useTheme } from './ThemeProvider.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog.js';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command.js';

export type ContentEditorCommandMenuPage =
  | { id: 'root' }
  | { id: 'create' }
  | { id: 'draft'; draftId: string };

export type ContentEditorCommandMenuAlert = { id: 'closeDraft'; draftId: string };

export function ContentEditorCommandMenu({
  state,
  dispatch,
}: {
  state: Readonly<CommandMenuState<ContentEditorCommandMenuPage, ContentEditorCommandMenuAlert>>;
  dispatch: Dispatch<
    CommandMenuAction<ContentEditorCommandMenuPage, ContentEditorCommandMenuAlert>
  >;
}) {
  const { schema, drafts } = useContext(EntityEditorStateContext);
  const dispatchEntityEditor = useContext(EntityEditorDispatchContext);

  useOpenCommandMenu(dispatch);

  if (state.alert) {
    return (
      <Alert alert={state.alert} dispatch={dispatch} dispatchEntityEditor={dispatchEntityEditor} />
    );
  }

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
            {drafts.length > 0 && (
              <CommandGroup heading="Entities">
                {drafts.map((draft) => (
                  <CommandItem
                    key={draft.id}
                    onSelect={() =>
                      dispatch(
                        new CommandMenuState_OpenPageAction({ id: 'draft', draftId: draft.id }),
                      )
                    }
                  >
                    <DraftItem draft={draft} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <GenericCommands dispatch={dispatch} />
          </>
        )}
        {state.currentPage?.id === 'create' && (
          <CreateEntityCommandGroup {...{ schema, dispatchEntityEditor, dispatch }} />
        )}
        {state.currentPage?.id === 'draft' && (
          <DraftCommandGroup
            id={state.currentPage.draftId}
            {...{ schema, dispatchEntityEditor, dispatch }}
          />
        )}
      </CommandList>
    </CommandDialog>
  );
}

function Alert({
  alert,
  dispatch,
  dispatchEntityEditor,
}: {
  alert: ContentEditorCommandMenuAlert;
  dispatch: Dispatch<
    CommandMenuAction<ContentEditorCommandMenuPage, ContentEditorCommandMenuAlert>
  >;
  dispatchEntityEditor: Dispatch<EntityEditorStateAction>;
}) {
  switch (alert.id) {
    case 'closeDraft':
      return (
        <AlertDialog open onOpenChange={() => dispatch(new CommandMenuState_CloseAlertAction())}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to close this entity?</AlertDialogTitle>
              <AlertDialogDescription>All changes will be lost.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  dispatchEntityEditor(new EntityEditorActions.DeleteDraft(alert.draftId));
                }}
              >
                Close
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    default:
      alert.id satisfies never;
  }
}

function DraftItem({ draft }: { draft: EntityEditorDraftState }) {
  return (
    <span>
      {draft.draft?.entitySpec.name} / {draft.draft?.name}
    </span>
  );
}

function CreateEntityCommandGroup({
  schema,
  dispatchEntityEditor,
  dispatch,
}: {
  schema: Schema | null;
  dispatchEntityEditor: Dispatch<EntityEditorStateAction>;
  dispatch: Dispatch<
    CommandMenuAction<ContentEditorCommandMenuPage, ContentEditorCommandMenuAlert>
  >;
}) {
  return (
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
  );
}

function DraftCommandGroup({
  id,
  dispatchEntityEditor,
  dispatch,
}: {
  id: string;
  dispatchEntityEditor: Dispatch<EntityEditorStateAction>;
  dispatch: Dispatch<
    CommandMenuAction<ContentEditorCommandMenuPage, ContentEditorCommandMenuAlert>
  >;
}) {
  const draft = useContext(EntityEditorStateContext).drafts.find((d) => d.id === id);
  if (!draft) {
    return null;
  }

  const confirmClose = draft.status === 'changed' || !draft.entity;

  return (
    <CommandGroup heading={<DraftItem draft={draft} />}>
      <CommandItem
        onSelect={() => {
          dispatchEntityEditor(new EntityEditorActions.SetActiveEntity(id, true, true));
          dispatch(new CommandMenuState_CloseAction());
        }}
      >
        Jump to
      </CommandItem>
      <CommandItem
        onSelect={() => {
          dispatch(new CommandMenuState_CloseAction());
          if (confirmClose) {
            dispatch(new CommandMenuState_ShowAlertAction({ id: 'closeDraft', draftId: id }));
          } else {
            dispatchEntityEditor(new EntityEditorActions.DeleteDraft(id));
          }
        }}
      >
        Close{confirmClose ? '...' : ''}
      </CommandItem>
    </CommandGroup>
  );
}

function GenericCommands<TPage, TAlert>({
  dispatch,
}: {
  dispatch: Dispatch<CommandMenuAction<TPage, TAlert>>;
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
