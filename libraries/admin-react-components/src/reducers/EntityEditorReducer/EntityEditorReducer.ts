import type { AdminSchema } from '@jonasb/datadata-core';
import { v4 as uuidv4 } from 'uuid';

type EntityEditorSelector = { id: string } | { id?: string; newType: string };

export interface EntityEditorState {
  status: 'uninitialized' | 'changed' | '';
  schema: AdminSchema | null;
  drafts: EntityEditorDraftState[];
}

interface EntityEditorDraftState {
  id: string;
}

interface EntityEditorStateAction {
  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState>;
}

export function initializeEntityEditorState(): EntityEditorState {
  return { status: 'uninitialized', schema: null, drafts: [] };
}

export function reduceEntityEditorState(
  state: Readonly<EntityEditorState>,
  action: EntityEditorStateAction
): Readonly<EntityEditorState> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

// ACTIONS

class AddDraftAction implements EntityEditorStateAction {
  selector: EntityEditorSelector;
  constructor(selector: EntityEditorSelector) {
    this.selector = selector;
  }

  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState> {
    const draft: EntityEditorDraftState = { id: this.selector.id ?? uuidv4() };
    return { ...state, drafts: [...state.drafts, draft] };
  }
}

class UpdateSchemaSpecificationAction implements EntityEditorStateAction {
  schema: AdminSchema;
  constructor(schema: AdminSchema) {
    this.schema = schema;
  }

  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState> {
    return { ...state, schema: this.schema };
  }
}

export const EntityEditorActions = {
  AddDraft: AddDraftAction,
  UpdateSchemaSpecification: UpdateSchemaSpecificationAction,
};
