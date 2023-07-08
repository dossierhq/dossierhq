import { ButtonDropdown, Input } from '@dossierhq/design';
import type { ReactNode } from 'react';
import { useCallback } from 'react';
import type { SchemaEditorState } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

interface Props {
  readOnly?: boolean;
  value: string | null;
  schemaEditorState: SchemaEditorState;
  onChange: (value: string | null) => void;
}

interface Item {
  id: string;
  label: ReactNode;
}

const EMPTY_ID = '  empty  ';

export function PatternSelector({ readOnly, value, schemaEditorState, onChange }: Props) {
  const items: Item[] = [
    { id: EMPTY_ID, label: <i>Not set</i> },
    ...schemaEditorState.patterns.map((pattern) => ({ id: pattern.name, label: pattern.name })),
  ];

  const handleItemClick = useCallback(
    (item: Item) => onChange(item.id === EMPTY_ID ? null : item.id),
    [onChange],
  );

  if (readOnly) {
    return (
      <Input readOnly value={value ?? undefined} placeholder={!value ? 'Not set' : undefined} />
    );
  }

  return (
    <ButtonDropdown
      items={items}
      renderItem={(item) => item.label}
      activeItemIds={[value ? value : EMPTY_ID]}
      onItemClick={handleItemClick}
    >
      {value ?? <i>Not set</i>}
    </ButtonDropdown>
  );
}
