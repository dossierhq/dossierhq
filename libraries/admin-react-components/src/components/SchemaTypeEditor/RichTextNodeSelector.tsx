import { RichTextNodeType } from '@jonasb/datadata-core';
import {
  initializeMultipleSelectorState,
  MultipleSelectorStateActions,
  reduceMultipleSelectorState,
  TagInputSelector,
} from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import { useEffect, useMemo, useReducer } from 'react';
import type {
  SchemaEditorStateAction,
  SchemaFieldSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import {
  ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER,
  SchemaEditorActions,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

function useSynchronizeMultipleSelectorState(
  fieldSelector: SchemaFieldSelector,
  selectedIds: string[],
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>
) {
  const items = useMemo(
    () => [
      {
        id: ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER,
        removable:
          selectedIds.length === 0 ||
          (selectedIds.length === 1 && selectedIds[0] === ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER),
      },
      { id: RichTextNodeType.entity },
      { id: RichTextNodeType.entityLink },
      { id: RichTextNodeType.valueItem },
    ],
    [selectedIds]
  );

  const [state, dispatch] = useReducer(
    reduceMultipleSelectorState,
    { items, selectedIds },
    initializeMultipleSelectorState
  );

  useEffect(() => {
    dispatchSchemaEditorState(
      new SchemaEditorActions.ChangeFieldAllowedRichTextNodes(fieldSelector, state.selectedIds)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedIds]);

  useEffect(() => {
    dispatch(new MultipleSelectorStateActions.SetSelection(selectedIds));
  }, [selectedIds]);

  useEffect(() => {
    dispatch(new MultipleSelectorStateActions.UpdateItems(items));
  }, [items]);

  return { state, dispatch };
}

interface Props {
  fieldSelector: SchemaFieldSelector;
  richTextNodes: string[];
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function RichTextNodeSelector({
  fieldSelector,
  richTextNodes,
  dispatchSchemaEditorState,
}: Props) {
  const { state, dispatch } = useSynchronizeMultipleSelectorState(
    fieldSelector,
    richTextNodes,
    dispatchSchemaEditorState
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
