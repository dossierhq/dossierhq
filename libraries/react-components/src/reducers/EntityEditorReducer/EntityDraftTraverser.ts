import type { Schema, ContentTraverseNode } from '@dossierhq/core';
import { traverseContentField } from '@dossierhq/core';
import type { EntityEditorDraftState } from './EntityEditorReducer.js';

export function* traverseEntityEditorDraft(
  schema: Schema,
  draftState: EntityEditorDraftState,
): Generator<ContentTraverseNode<Schema>> {
  if (!draftState.draft) {
    return;
  }

  const path = [`draft(${draftState.id})`, 'fields'];

  for (const field of draftState.draft.fields) {
    const { fieldSpec, value } = field;
    const fieldPath = [...path, fieldSpec.name];
    yield* traverseContentField(schema, fieldPath, fieldSpec, value);
  }
}
