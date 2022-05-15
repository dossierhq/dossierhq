import type { AdminItemTraverseNode, AdminSchema } from '@jonasb/datadata-core';
import { traverseAdminItemField } from '@jonasb/datadata-core';
import type { EntityEditorDraftState } from './EntityEditorReducer';

export function* traverseEntityEditorDraft(
  schema: AdminSchema,
  draftState: EntityEditorDraftState
): Generator<AdminItemTraverseNode> {
  if (!draftState.draft) {
    return;
  }

  const path = [`draft(${draftState.id})`, 'fields'];

  for (const field of draftState.draft.fields) {
    const { fieldSpec, value } = field;
    const fieldPath = [...path, fieldSpec.name];
    yield* traverseAdminItemField(schema, fieldPath, fieldSpec, value);
  }
}
