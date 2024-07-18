import { Command as CommandPrimitive } from 'cmdk';
import { XIcon } from 'lucide-react';
import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { Badge } from './ui/badge.js';
import { Command, CommandGroup, CommandItem, CommandList } from './ui/command.js';

export function MultiCombobox<TItem extends { value: string; label: string }>({
  items,
  selected,
  placeholder,
  onSelect,
  onUnselect,
}: {
  items: TItem[];
  selected: string[];
  placeholder?: string;
  onSelect: (value: TItem['value']) => void;
  onUnselect: (value: TItem['value']) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (input.value === '') {
            onUnselect(selected[selected.length - 1]);
          }
        }
        if (e.key === 'Escape') {
          input.blur();
        }
      }
    },
    [onUnselect, selected],
  );

  const selectables = items.filter((it) => !selected.includes(it.value));

  return (
    <Command
      onKeyDown={handleKeyDown}
      onBlur={() => setInputValue('')}
      className="overflow-visible bg-transparent"
    >
      <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {selected.map((value) => {
            const item = items.find((it) => it.value === value)!;
            return (
              <Badge key={item.value} variant="secondary">
                {item.label}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onUnselect(value);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => onUnselect(value)}
                >
                  <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            );
          })}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative mt-2">
        <CommandList>
          {open && selectables.length > 0 ? (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
              <CommandGroup className="h-full overflow-auto">
                {selectables.map((item) => {
                  return (
                    <CommandItem
                      key={item.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={(_value) => {
                        setInputValue('');
                        onSelect(item.value);
                      }}
                      className="cursor-pointer"
                    >
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ) : null}
        </CommandList>
      </div>
    </Command>
  );
}
