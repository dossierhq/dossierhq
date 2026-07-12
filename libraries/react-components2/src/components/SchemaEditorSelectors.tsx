import type { SchemaEditorState } from '../reducers/SchemaEditorReducer.js';
import { Input } from './ui/input.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.js';

const EMPTY_ID = '  empty  ';

interface SelectorProps {
  readOnly?: boolean;
  value: string | null;
  schemaEditorState: SchemaEditorState;
  onChange: (value: string | null) => void;
}

export function PatternSelector({ readOnly, value, schemaEditorState, onChange }: SelectorProps) {
  return (
    <NameSelector
      readOnly={readOnly}
      value={value}
      names={schemaEditorState.patterns.map((it) => it.name)}
      onChange={onChange}
    />
  );
}

export function IndexSelector({ readOnly, value, schemaEditorState, onChange }: SelectorProps) {
  return (
    <NameSelector
      readOnly={readOnly}
      value={value}
      names={schemaEditorState.indexes.filter((it) => it.type === 'unique').map((it) => it.name)}
      onChange={onChange}
    />
  );
}

export function NameSelector({
  readOnly,
  value,
  names,
  onChange,
}: {
  readOnly?: boolean;
  value: string | null;
  names: string[];
  onChange: (value: string | null) => void;
}) {
  if (readOnly) {
    return <Input readOnly value={value ?? ''} placeholder={!value ? 'Not set' : undefined} />;
  }

  return (
    <Select
      value={value ?? EMPTY_ID}
      onValueChange={(newValue) => onChange(newValue === EMPTY_ID ? null : newValue)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Not set" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={EMPTY_ID}>
          <i>Not set</i>
        </SelectItem>
        {names.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
