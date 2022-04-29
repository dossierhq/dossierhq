import type { AdminEntity, AdminSchema } from '@jonasb/datadata-core';
import { v4 as uuidv4 } from 'uuid';

type EntityEditorSelector = { id: string } | { id?: string; newType: string };

export interface EntityEditorState {
  status: 'uninitialized' | 'changed' | '';
  schema: AdminSchema | null;
  drafts: EntityEditorDraftState[];
  activeEntityId: string | null;
}

export interface EntityEditorDraftState {
  id: string;
  entity: { type: string } | null;
}

export interface EntityEditorStateAction {
  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState>;
}

export function initializeEntityEditorState(): EntityEditorState {
  return { status: 'uninitialized', schema: null, drafts: [], activeEntityId: null };
}

export function reduceEntityEditorState(
  state: Readonly<EntityEditorState>,
  action: EntityEditorStateAction
): Readonly<EntityEditorState> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

// ACTION HELPERS

abstract class EntityEditorDraftAction implements EntityEditorStateAction {
  id: string;
  constructor(id: string) {
    this.id = id;
  }

  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState> {
    const draftIndex = state.drafts.findIndex((it) => it.id === this.id);
    if (draftIndex < 0) throw new Error(`No such draft for id ${this.id}`);
    const currentDraft = state.drafts[draftIndex];

    const newDraft = this.reduceDraft(currentDraft);
    if (newDraft === currentDraft) {
      return state;
    }

    const newDrafts = [...state.drafts];
    newDrafts[draftIndex] = newDraft;

    return { ...state, drafts: newDrafts };
  }

  abstract reduceDraft(
    draftState: Readonly<EntityEditorDraftState>
  ): Readonly<EntityEditorDraftState>;
}

// ACTIONS

class AddDraftAction implements EntityEditorStateAction {
  selector: EntityEditorSelector;
  constructor(selector: EntityEditorSelector) {
    this.selector = selector;
  }

  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState> {
    if (this.selector.id && state.drafts.find((it) => it.id === this.selector.id)) {
      return state;
    }
    const draft: EntityEditorDraftState = { id: this.selector.id ?? uuidv4(), entity: null };
    if ('newType' in this.selector) {
      draft.entity = { type: this.selector.newType };
    }

    return { ...state, drafts: [...state.drafts, draft], activeEntityId: draft.id };
  }
}

class SetActiveEntityAction implements EntityEditorStateAction {
  id: string;
  constructor(id: string) {
    this.id = id;
  }

  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState> {
    return { ...state, activeEntityId: this.id };
  }
}

class UpdateEntityAction extends EntityEditorDraftAction {
  entity: AdminEntity;
  constructor(entity: AdminEntity) {
    super(entity.id);
    this.entity = entity;
  }

  reduceDraft(draftState: Readonly<EntityEditorDraftState>): Readonly<EntityEditorDraftState> {
    //TODO handle when changed on server
    if (draftState.entity) {
      return draftState;
    }
    return { ...draftState, entity: { type: this.entity.info.type } };
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
  SetActiveEntity: SetActiveEntityAction,
  UpdateEntity: UpdateEntityAction,
  UpdateSchemaSpecification: UpdateSchemaSpecificationAction,
};
