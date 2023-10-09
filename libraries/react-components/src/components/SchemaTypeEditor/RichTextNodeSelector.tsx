import { RichTextNodeType } from '@dossierhq/core';
import {
  initializeMultipleSelectorState,
  MultipleSelectorStateActions,
  reduceMultipleSelectorState,
  TagInputSelector,
} from '@dossierhq/design';
import type { Dispatch } from 'react';
import { useEffect, useMemo, useReducer } from 'react';
import {
  REQUIRED_NODES_PLACEHOLDER,
  RichTextNodePlaceholders,
  SchemaEditorActions,
  sortRichTextNodesWithPlaceholders,
  type SchemaEditorStateAction,
  type SchemaFieldSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

const RichTextNodesNotInPlaceholders: string[] = [
  RichTextNodeType.heading,
  RichTextNodeType.entity,
  RichTextNodeType.entityLink,
  RichTextNodeType.link,
  RichTextNodeType.component,
];

function useSynchronizeMultipleSelectorState(
  fieldSelector: SchemaFieldSelector,
  selectedIds: string[],
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>,
) {
  const items = useMemo(() => {
    const allNodes = [
      ...RichTextNodePlaceholders.map((it) => it.name),
      ...RichTextNodesNotInPlaceholders,
    ];
    sortRichTextNodesWithPlaceholders(allNodes);

    const result: { id: string; removable: boolean }[] = allNodes.map((it) => ({
      id: it,
      removable: it === REQUIRED_NODES_PLACEHOLDER.name ? selectedIds.length <= 1 : true,
    }));
    return result;
  }, [selectedIds.length]);

  const [state, dispatch] = useReducer(
    reduceMultipleSelectorState,
    { items, selectedIds },
    initializeMultipleSelectorState,
  );

  useEffect(() => {
    dispatchSchemaEditorState(
      new SchemaEditorActions.ChangeFieldAllowedRichTextNodes(fieldSelector, state.selectedIds),
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
    dispatchSchemaEditorState,
  );
  return (
    <TagInputSelector
      clearLabel="Clear"
      itemTag={(item) => ({ tag: item.id, transform: '' })}
      state={state}
      dispatch={dispatch}
    />
  );
}
