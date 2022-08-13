import { RichTextNodeType } from '@jonasb/datadata-core';
import type { MultipleSelectorItem } from '@jonasb/datadata-design';
import {
  initializeMultipleSelectorState,
  MultipleSelectorStateActions,
  reduceMultipleSelectorState,
  TagInputSelector,
} from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import { useEffect, useReducer } from 'react';
import type {
  SchemaEditorStateAction,
  SchemaFieldSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

function useSynchronizeMultipleSelectorState<TItem extends MultipleSelectorItem>(
  fieldSelector: SchemaFieldSelector,
  items: TItem[],
  selectedIds: string[],
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>
) {
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
  const items = [
    { id: RichTextNodeType.root },
    { id: RichTextNodeType.paragraph },
    { id: RichTextNodeType.text },
    { id: RichTextNodeType.entity },
    { id: RichTextNodeType.valueItem },
  ];
  const { state, dispatch } = useSynchronizeMultipleSelectorState(
    fieldSelector,
    items,
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
