import type { MultipleSelectorItem } from '@dossierhq/design';
import {
  initializeMultipleSelectorState,
  MultipleSelectorStateActions,
  reduceMultipleSelectorState,
  TagInputSelector,
} from '@dossierhq/design';
import type { Dispatch } from 'react';
import { useEffect, useReducer } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaFieldSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

function useSynchronizeMultipleSelectorState<TItem extends MultipleSelectorItem>(
  fieldSelector: SchemaFieldSelector,
  items: TItem[],
  selectedIds: string[],
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>,
) {
  const [state, dispatch] = useReducer(
    reduceMultipleSelectorState,
    { items, selectedIds },
    initializeMultipleSelectorState,
  );

  useEffect(() => {
    dispatchSchemaEditorState(
      new SchemaEditorActions.ChangeFieldAllowedComponentTypes(fieldSelector, state.selectedIds),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedIds]);

  useEffect(() => {
    dispatch(new MultipleSelectorStateActions.UpdateItems(items));
  }, [items]);

  useEffect(() => {
    dispatch(new MultipleSelectorStateActions.SetSelection(selectedIds));
  }, [selectedIds]);

  return { state, dispatch };
}

interface Props {
  fieldSelector: SchemaFieldSelector;
  componentTypes: string[];
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function FieldComponentTypeSelector({
  fieldSelector,
  componentTypes,
  schemaEditorState,
  dispatchSchemaEditorState,
}: Props) {
  const items = schemaEditorState.componentTypes.map((it) => ({ id: it.name }));
  const { state, dispatch } = useSynchronizeMultipleSelectorState(
    fieldSelector,
    items,
    componentTypes,
    dispatchSchemaEditorState,
  );
  return (
    <TagInputSelector
      clearLabel="Clear"
      itemTag={(item) => ({ tag: item.id })}
      state={state}
      dispatch={dispatch}
    />
  );
}
