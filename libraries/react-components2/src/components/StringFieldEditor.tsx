import type { StringFieldSpecification } from '@dossierhq/core';
import { XIcon } from 'lucide-react';
import { useCallback, type ChangeEvent } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';
import { Button } from './ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';
import { Input } from './ui/input.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.js';
import { Textarea } from './ui/textarea.js';
import { ValidationIssuesDisplay } from './ValidationIssuesDisplay.js';

type Props = FieldEditorProps<StringFieldSpecification, string>;

export function StringFieldEditor(props: Props) {
  const { id, fieldSpec, value, validationIssues, dragHandle, onChange } = props;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  if (fieldSpec.values.length > 0) {
    return <StringValueFieldEditor {...props} />;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {dragHandle}
        {fieldSpec.multiline ? (
          <Textarea id={id} className="flex-grow" value={value ?? ''} onChange={handleChange} />
        ) : (
          <Input id={id} className="flex-grow" value={value ?? ''} onChange={handleChange} />
        )}
      </div>
      <ValidationIssuesDisplay validationIssues={validationIssues} />
    </>
  );
}

function StringValueFieldEditor({
  id,
  fieldSpec,
  value,
  validationIssues,
  dragHandle,
  onChange,
}: Props) {
  const handleClear = useCallback(() => onChange(null), [onChange]);

  return (
    <>
      <div className="group flex items-center gap-2">
        {dragHandle}
        <Select value={value ?? ''} onValueChange={onChange}>
          <SelectTrigger id={id}>
            <SelectValue placeholder="Not set" />
          </SelectTrigger>
          <SelectContent>
            {fieldSpec.values.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Clear"
          className="size-6 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
          onClick={handleClear}
        >
          <XIcon />
        </Button>
      </div>
      <ValidationIssuesDisplay validationIssues={validationIssues} />
    </>
  );
}

export function AddStringListItemButton({
  fieldSpec,
  onAddItem,
}: {
  fieldSpec: StringFieldSpecification;
  onAddItem: (value: string | null) => void;
}) {
  if (fieldSpec.values.length > 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="self-start">Add</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {fieldSpec.values.map((item) => (
            <DropdownMenuItem key={item.value} onSelect={() => onAddItem(item.value)}>
              {item.value}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button className="self-start" onClick={() => onAddItem(null)}>
      Add
    </Button>
  );
}
