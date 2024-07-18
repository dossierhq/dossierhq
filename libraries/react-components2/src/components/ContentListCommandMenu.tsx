import type { Schema } from '@dossierhq/core';
import {
  AsteriskIcon,
  Columns2Icon,
  LaptopIcon,
  ListIcon,
  MapIcon,
  MilestoneIcon,
  MoonIcon,
  PlusIcon,
  Rows2Icon,
  ShapesIcon,
  SquareCheckBigIcon,
  SquareIcon,
  SunIcon,
} from 'lucide-react';
import type { Dispatch } from 'react';
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
import {
  ContentListStateActions,
  type ContentListState,
  type ContentListStateAction,
} from '../reducers/ContentListReducer.js';
import { useTheme } from './ThemeProvider.js';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command.js';

export type ContentListCommandMenuPage =
  | { id: 'root' }
  | { id: 'create' }
  | { id: 'filterContentTypes' };

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
  contentListState,
  dispatchContentList,
  onCreateEntity,
}: {
  state: Readonly<ContentListCommandMenuState>;
  dispatch: Dispatch<ContentListCommandMenuAction>;
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
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
                <PlusIcon className="mr-2 h-4 w-4" />
                <span>Create entity</span>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Filters">
              <CommandItem onSelect={() => {}}>
                <MilestoneIcon className="mr-2 h-4 w-4" />
                Status
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  dispatch(new CommandMenuState_OpenPageAction({ id: 'filterContentTypes' }));
                }}
              >
                <ShapesIcon className="mr-2 h-4 w-4" />
                <span className="max-w-96 overflow-hidden text-ellipsis whitespace-nowrap">
                  Content types
                </span>
              </CommandItem>
              <CommandItem
                disabled={
                  !contentListState.query.authKeys &&
                  !contentListState.query.componentTypes &&
                  !contentListState.query.entityTypes
                }
                onSelect={() => {
                  dispatchContentList(
                    new ContentListStateActions.SetQuery(
                      { text: contentListState.text },
                      { partial: false, resetPagingIfModifying: true },
                    ),
                  );
                  dispatch(new CommandMenuState_ToggleShowAction(false));
                }}
              >
                <AsteriskIcon className="mr-2 h-4 w-4" />
                <span>Clear all filters</span>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="View mode">
              {contentListState.viewMode !== 'list' && (
                <CommandItem
                  onSelect={() => {
                    dispatchContentList(new ContentListStateActions.SetViewMode('list'));
                    dispatch(new CommandMenuState_ToggleShowAction(false));
                  }}
                >
                  <ListIcon className="mr-2 h-4 w-4" />
                  <span>List</span>
                </CommandItem>
              )}
              {contentListState.viewMode !== 'split' && (
                <CommandItem
                  onSelect={() => {
                    dispatchContentList(new ContentListStateActions.SetViewMode('split'));
                    dispatch(new CommandMenuState_ToggleShowAction(false));
                  }}
                >
                  <Columns2Icon className="mr-2 hidden h-4 w-4 lg:block" />
                  <Rows2Icon className="mr-2 h-4 w-4 lg:hidden" />
                  <span>Split</span>
                </CommandItem>
              )}
              {contentListState.viewMode !== 'map' && (
                <CommandItem
                  onSelect={() => {
                    dispatchContentList(new ContentListStateActions.SetViewMode('map'));
                    dispatch(new CommandMenuState_ToggleShowAction(false));
                  }}
                >
                  <MapIcon className="mr-2 h-4 w-4" />
                  <span>Map</span>
                </CommandItem>
              )}
            </CommandGroup>
            <GenericCommands dispatch={dispatch} />
          </>
        )}
        {state.currentPage?.id === 'create' && (
          <CreateEntityCommandGroup {...{ schema, dispatch, onCreateEntity }} />
        )}
        {state.currentPage?.id === 'filterContentTypes' && (
          <FilterContentTypesCommandGroup {...{ schema, contentListState, dispatchContentList }} />
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

function FilterContentTypesCommandGroup({
  schema,
  contentListState,
  dispatchContentList,
}: {
  schema: Schema | undefined;
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
}) {
  return (
    <>
      <CommandItem
        disabled={
          contentListState.query.entityTypes === undefined &&
          contentListState.query.componentTypes === undefined
        }
        onSelect={() =>
          dispatchContentList(
            new ContentListStateActions.SetQuery(
              { entityTypes: undefined, componentTypes: undefined },
              { partial: true, resetPagingIfModifying: true },
            ),
          )
        }
      >
        <AsteriskIcon className="mr-2 h-4 w-4" />
        <span>Include all content types</span>
      </CommandItem>
      <CommandGroup heading="Entity types">
        {schema?.spec.entityTypes.map((entityType) => {
          const selected = contentListState.query.entityTypes?.includes(entityType.name);
          return (
            <CommandItem
              key={entityType.name}
              onSelect={() => {
                dispatchContentList(
                  new ContentListStateActions.SetQuery(
                    {
                      entityTypes: selected
                        ? contentListState.query.entityTypes?.filter((it) => it !== entityType.name)
                        : [...(contentListState.query.entityTypes ?? []), entityType.name],
                    },
                    { partial: true, resetPagingIfModifying: true },
                  ),
                );
              }}
            >
              {selected ? (
                <SquareCheckBigIcon className="mr-2 h-4 w-4" />
              ) : (
                <SquareIcon className="mr-2 h-4 w-4" />
              )}
              <span>{entityType.name}</span>
            </CommandItem>
          );
        })}
      </CommandGroup>
      {!!schema?.spec.componentTypes && (
        <CommandGroup heading="Component types">
          {schema?.spec.componentTypes.map((componentType) => {
            const selected = contentListState.query.componentTypes?.includes(componentType.name);
            return (
              <CommandItem
                key={componentType.name}
                onSelect={() => {
                  dispatchContentList(
                    new ContentListStateActions.SetQuery(
                      {
                        componentTypes: selected
                          ? contentListState.query.componentTypes?.filter(
                              (it) => it !== componentType.name,
                            )
                          : [...(contentListState.query.componentTypes ?? []), componentType.name],
                      },
                      { partial: true, resetPagingIfModifying: true },
                    ),
                  );
                }}
              >
                {selected ? (
                  <SquareCheckBigIcon className="mr-2 h-4 w-4" />
                ) : (
                  <SquareIcon className="mr-2 h-4 w-4" />
                )}
                <span>{componentType.name}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      )}
    </>
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
