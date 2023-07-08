import { ButtonDropdown } from '@dossierhq/design';
import type { Dispatch, ReactNode } from 'react';
import { useCallback } from 'react';
import type {
  SchemaEditorStateAction,
  SchemaTypeSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

interface Props {
  potentialNameFields: string[];
  value: string | null;
  typeSelector: SchemaTypeSelector;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

interface Item {
  id: string;
  label: ReactNode;
}

const EMPTY_ID = '  empty  ';

export function NameFieldSelector({
  value,
  potentialNameFields,
  typeSelector,
  dispatchSchemaEditorState,
}: Props) {
  const items: Item[] = [
    { id: EMPTY_ID, label: <i>Not set</i> },
    ...potentialNameFields.map((name) => ({ id: name, label: name })),
  ];

  const handleItemClick = useCallback(
    (item: Item) =>
      dispatchSchemaEditorState(
        new SchemaEditorActions.ChangeTypeNameField(
          typeSelector,
          item.id === EMPTY_ID ? null : item.id,
        ),
      ),
    [dispatchSchemaEditorState, typeSelector],
  );

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
