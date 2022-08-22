import type { AdminSchema, ItemTraverseNode } from '@jonasb/datadata-core';
import { traverseItemField } from '@jonasb/datadata-core';
import type { EntityEditorDraftState } from './EntityEditorReducer';

export function* traverseEntityEditorDraft(
  schema: AdminSchema,
  draftState: EntityEditorDraftState
): Generator<ItemTraverseNode<AdminSchema>> {
  if (!draftState.draft) {
    return;
  }

  const path = [`draft(${draftState.id})`, 'fields'];

  for (const field of draftState.draft.fields) {
    const { fieldSpec, value } = field;
    const fieldPath = [...path, fieldSpec.name];
    yield* traverseItemField(schema, fieldPath, fieldSpec, value);
  }
}
