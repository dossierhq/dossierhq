import {
  initializeMultipleSelectorState,
  MultipleSelectorStateActions,
  reduceMultipleSelectorState,
  TagInputSelector,
  type MultipleSelectorItem,
} from '@dossierhq/design';
import { useEffect, useReducer, type Dispatch } from 'react';
import {
  SchemaEditorActions,
  type SchemaEditorState,
  type SchemaEditorStateAction,
  type SchemaFieldSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

function useSynchronizeMultipleSelectorState<TItem extends MultipleSelectorItem>(
  fieldSelector: SchemaFieldSelector,
  referenceOrLink: 'reference' | 'link',
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
      referenceOrLink === 'reference'
        ? new SchemaEditorActions.ChangeFieldAllowedEntityTypes(fieldSelector, state.selectedIds)
        : new SchemaEditorActions.ChangeFieldAllowedLinkEntityTypes(
            fieldSelector,
            state.selectedIds,
          ),
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
  referenceOrLink: 'reference' | 'link';
  entityTypes: string[];
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function FieldEntityTypeSelector({
  fieldSelector,
  referenceOrLink,
  entityTypes,
  schemaEditorState,
  dispatchSchemaEditorState,
}: Props) {
  const items = schemaEditorState.entityTypes.map((it) => ({ id: it.name }));
  const { state, dispatch } = useSynchronizeMultipleSelectorState(
    fieldSelector,
    referenceOrLink,
    items,
    entityTypes,
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
