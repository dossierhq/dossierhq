import type { Schema } from '@dossierhq/core';
import { Command as CommandPrimitive } from 'cmdk';
import { XIcon } from 'lucide-react';
import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
} from 'react';
import {
  ContentListStateActions,
  type ContentListState,
  type ContentListStateAction,
} from '../reducers/ContentListReducer.js';
import { Badge } from './ui/badge.js';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from './ui/command.js';

const EMPTY_LIST: string[] = [];

export function ContentTypesSelector({
  schema,
  contentListState,
  dispatchContentList,
}: {
  schema: Schema | undefined;
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const entityTypes = contentListState.query.entityTypes ?? EMPTY_LIST;
  const componentTypes = contentListState.query.componentTypes ?? EMPTY_LIST;

  const selectableEntityTypes =
    schema?.spec.entityTypes.filter((it) => !entityTypes.includes(it.name)).map((it) => it.name) ??
    EMPTY_LIST;
  const selectableComponentTypes =
    schema?.spec.componentTypes
      .filter((it) => !componentTypes.includes(it.name))
      .map((it) => it.name) ?? EMPTY_LIST;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (input.value === '') {
            if (componentTypes.length > 0) {
              const newComponentTypes = componentTypes.slice(0, -1);
              dispatchContentList(
                new ContentListStateActions.SetQuery(
                  { componentTypes: newComponentTypes },
                  { partial: true, resetPagingIfModifying: true },
                ),
              );
            } else if (entityTypes.length > 0) {
              const newEntityTypes = entityTypes.slice(0, -1);
              dispatchContentList(
                new ContentListStateActions.SetQuery(
                  { entityTypes: newEntityTypes },
                  { partial: true, resetPagingIfModifying: true },
                ),
              );
            }
          }
        }
        if (e.key === 'Escape') {
          input.blur();
        }
      }
    },
    [componentTypes, dispatchContentList, entityTypes],
  );

  return (
    <div>
      <Command
        onKeyDown={handleKeyDown}
        onBlur={() => setInputValue('')}
        className="overflow-visible bg-transparent"
      >
        <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <div className="flex flex-wrap gap-1">
            {entityTypes.map((value) => (
              <SelectedBadge
                key={value}
                label={value}
                onRemove={() =>
                  dispatchContentList(
                    new ContentListStateActions.SetQuery(
                      { entityTypes: entityTypes.filter((it) => it !== value) },
                      { partial: true, resetPagingIfModifying: true },
                    ),
                  )
                }
              />
            ))}
            {componentTypes.map((value) => (
              <SelectedBadge
                key={value}
                label={value}
                onRemove={() =>
                  dispatchContentList(
                    new ContentListStateActions.SetQuery(
                      { componentTypes: componentTypes.filter((it) => it !== value) },
                      { partial: true, resetPagingIfModifying: true },
                    ),
                  )
                }
              />
            ))}
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => setOpen(false)}
              onFocus={() => setOpen(true)}
              placeholder="Content type"
              className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="relative">
          <CommandList>
            {open ? (
              <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                <CommandEmpty>{inputValue ? 'No matches' : 'No more content types'}</CommandEmpty>
                {selectableEntityTypes.length > 0 && (
                  <SelectableGroup
                    heading="Entity types"
                    items={selectableEntityTypes}
                    setInputValue={setInputValue}
                    onSelect={(value) =>
                      dispatchContentList(
                        new ContentListStateActions.SetQuery(
                          { entityTypes: [...entityTypes, value] },
                          { partial: true, resetPagingIfModifying: true },
                        ),
                      )
                    }
                  />
                )}
                {selectableComponentTypes.length > 0 && (
                  <SelectableGroup
                    heading="Component types"
                    items={selectableComponentTypes}
                    setInputValue={setInputValue}
                    onSelect={(value) =>
                      dispatchContentList(
                        new ContentListStateActions.SetQuery(
                          { componentTypes: [...componentTypes, value] },
                          { partial: true, resetPagingIfModifying: true },
                        ),
                      )
                    }
                  />
                )}
              </div>
            ) : null}
          </CommandList>
        </div>
      </Command>
    </div>
  );
}

function SelectedBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary">
      {label}
      <button
        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onRemove();
          }
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={onRemove}
      >
        <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </button>
    </Badge>
  );
}

function SelectableGroup({
  heading,
  items,
  setInputValue,
  onSelect,
}: {
  heading: string;
  items: string[];
  setInputValue: Dispatch<SetStateAction<string>>;
  onSelect: (value: string) => void;
}) {
  return (
    <CommandGroup heading={heading} className="h-full overflow-auto">
      {items.map((item) => {
        return (
          <CommandItem
            key={item}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onSelect={(_value) => {
              setInputValue('');
              onSelect(item);
            }}
            className="cursor-pointer"
          >
            {item}
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
