import { Button, ButtonDropdown } from '@jonasb/datadata-design';
import type { Dispatch, ReactNode } from 'react';
import { useCallback } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaTypeSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

interface Props {
  readOnly: boolean;
  typeSelector: SchemaTypeSelector;
  value: string | null;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

interface Item {
  id: string;
  label: ReactNode;
}

const EMPTY_ID = '  empty  ';

export function PatternSelector({
  readOnly,
  typeSelector,
  value,
  schemaEditorState,
  dispatchSchemaEditorState,
}: Props) {
  const items: Item[] = [
    { id: EMPTY_ID, label: <i>Not set</i> },
    ...schemaEditorState.patterns.map((pattern) => ({ id: pattern.name, label: pattern.name })),
  ];

  const handleItemClick = useCallback(
    (item: Item) => {
      dispatchSchemaEditorState(
        new SchemaEditorActions.ChangeTypeAuthKeyPattern(
          typeSelector,
          item.id === EMPTY_ID ? null : item.id
        )
      );
    },
    [dispatchSchemaEditorState, typeSelector]
  );

  if (readOnly) {
    return <Button disabled>{value ?? <i>Not set</i>}</Button>;
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
