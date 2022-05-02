import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityTypeSpecification,
  AdminEntityUpdate,
  AdminSchema,
  FieldSpecification,
} from '@jonasb/datadata-core';
import { assertIsDefined } from '@jonasb/datadata-core';
import { v4 as uuidv4 } from 'uuid';

type EntityEditorSelector = { id: string } | { id?: string; newType: string };

export interface EntityEditorState {
  status: 'uninitialized' | 'changed' | '';
  schema: AdminSchema | null;
  drafts: EntityEditorDraftState[];
  activeEntityId: string | null;
  activeEntityEditorScrollSignal: number;
  activeEntityMenuScrollSignal: number;
}

export interface EntityEditorDraftState {
  id: string;
  draft: {
    entitySpec: AdminEntityTypeSpecification;
    authKey: string | null;
    name: string;
    fields: FieldEditorState[];
  } | null;
  entity: AdminEntity | null;
  entityWillBeUpdatedDueToUpsert: boolean;
}

export interface FieldEditorState {
  fieldSpec: FieldSpecification;
  value: unknown;
}

export interface EntityEditorStateAction {
  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState>;
}

export function initializeEntityEditorState(): EntityEditorState {
  return {
    status: 'uninitialized',
    schema: null,
    drafts: [],
    activeEntityId: null,
    activeEntityEditorScrollSignal: 0,
    activeEntityMenuScrollSignal: 0,
  };
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

    const newDraft = this.reduceDraft(currentDraft, state);
    if (newDraft === currentDraft) {
      return state;
    }

    const newDrafts = [...state.drafts];
    newDrafts[draftIndex] = newDraft;

    return { ...state, drafts: newDrafts };
  }

  abstract reduceDraft(
    draftState: Readonly<EntityEditorDraftState>,
    editorState: Readonly<EntityEditorState>
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
    const { schema } = state;
    assertIsDefined(schema);
    const draft: EntityEditorDraftState = {
      id: this.selector.id ?? uuidv4(),
      draft: null,
      entity: null,
      entityWillBeUpdatedDueToUpsert: false,
    };
    if ('newType' in this.selector) {
      const entitySpec = schema.getEntityTypeSpecification(this.selector.newType);
      assertIsDefined(entitySpec);
      draft.draft = createEditorEntityDraftState(entitySpec, null);
    }

    return {
      ...state,
      drafts: [...state.drafts, draft],
      activeEntityId: draft.id,
      activeEntityEditorScrollSignal: state.activeEntityEditorScrollSignal + 1,
      activeEntityMenuScrollSignal: state.activeEntityMenuScrollSignal + 1,
    };
  }
}

class SetActiveEntityAction implements EntityEditorStateAction {
  id: string;
  increaseMenuScrollSignal: boolean;
  increaseEditorScrollSignal: boolean;

  constructor(id: string, increaseMenuScrollSignal: boolean, increaseEditorScrollSignal: boolean) {
    this.id = id;
    this.increaseMenuScrollSignal = increaseMenuScrollSignal;
    this.increaseEditorScrollSignal = increaseEditorScrollSignal;
  }

  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState> {
    if (state.activeEntityId === this.id) {
      return state;
    }
    let {
      activeEntityMenuScrollSignal: activeSelectorMenuScrollSignal,
      activeEntityEditorScrollSignal: activeSelectorEditorScrollSignal,
    } = state;
    if (this.increaseMenuScrollSignal) {
      activeSelectorMenuScrollSignal += 1;
    }
    if (this.increaseEditorScrollSignal) {
      activeSelectorEditorScrollSignal += 1;
    }

    return {
      ...state,
      activeEntityId: this.id,
      activeEntityMenuScrollSignal: activeSelectorMenuScrollSignal,
      activeEntityEditorScrollSignal: activeSelectorEditorScrollSignal,
    };
  }
}

class SetNameAction extends EntityEditorDraftAction {
  name: string;

  constructor(id: string, name: string) {
    super(id);
    this.name = name;
  }

  reduceDraft(
    draftState: Readonly<EntityEditorDraftState>,
    _editorState: Readonly<EntityEditorState>
  ): Readonly<EntityEditorDraftState> {
    if (!draftState.draft || draftState.draft?.name === this.name) {
      return draftState;
    }

    return { ...draftState, draft: { ...draftState.draft, name: this.name } };
  }
}

class SetNextEntityUpdateIsDueToUpsertAction extends EntityEditorDraftAction {
  entityWillBeUpdatedDueToUpsert: boolean;

  constructor(id: string, entityWillBeUpdatedDueToUpsert: boolean) {
    super(id);
    this.entityWillBeUpdatedDueToUpsert = entityWillBeUpdatedDueToUpsert;
  }

  reduceDraft(
    draftState: Readonly<EntityEditorDraftState>,
    _editorState: Readonly<EntityEditorState>
  ): Readonly<EntityEditorDraftState> {
    if (draftState.entityWillBeUpdatedDueToUpsert === this.entityWillBeUpdatedDueToUpsert) {
      return draftState;
    }

    return { ...draftState, entityWillBeUpdatedDueToUpsert: this.entityWillBeUpdatedDueToUpsert };
  }
}

class SetAuthKeyAction extends EntityEditorDraftAction {
  authKey: string;

  constructor(id: string, authKey: string) {
    super(id);
    this.authKey = authKey;
  }

  reduceDraft(
    draftState: Readonly<EntityEditorDraftState>,
    _editorState: Readonly<EntityEditorState>
  ): Readonly<EntityEditorDraftState> {
    if (!draftState.draft || draftState.draft?.name === this.authKey) {
      return draftState;
    }

    return { ...draftState, draft: { ...draftState.draft, authKey: this.authKey } };
  }
}

class UpdateEntityAction extends EntityEditorDraftAction {
  entity: AdminEntity;

  constructor(entity: AdminEntity) {
    super(entity.id);
    this.entity = entity;
  }

  reduceDraft(
    draftState: Readonly<EntityEditorDraftState>,
    editorState: EntityEditorState
  ): Readonly<EntityEditorDraftState> {
    //TODO handle when changed on server
    if (!draftState.entityWillBeUpdatedDueToUpsert && draftState.entity) {
      return draftState;
    }

    const { schema } = editorState;
    assertIsDefined(schema);
    const entitySpec = schema.getEntityTypeSpecification(this.entity.info.type);
    assertIsDefined(entitySpec);

    return {
      ...draftState,
      draft: createEditorEntityDraftState(entitySpec, this.entity),
      entity: this.entity,
    };
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
  SetAuthKey: SetAuthKeyAction,
  SetName: SetNameAction,
  SetNextEntityUpdateIsDueToUpsert: SetNextEntityUpdateIsDueToUpsertAction,
  UpdateEntity: UpdateEntityAction,
  UpdateSchemaSpecification: UpdateSchemaSpecificationAction,
};

// HELPERS

function createEditorEntityDraftState(
  entitySpec: AdminEntityTypeSpecification,
  entity: AdminEntity | null
): EntityEditorDraftState['draft'] {
  const fields = entitySpec.fields.map<FieldEditorState>((fieldSpec) => {
    const value = entity?.fields[fieldSpec.name] ?? null;
    return { fieldSpec, value };
  });
  return {
    entitySpec,
    authKey: entity?.info.authKey ?? null,
    name: entity?.info.name ?? '',
    fields,
  };
}

//

export function getEntityCreateFromDraftState(draftState: EntityEditorDraftState) {
  const { draft } = draftState;
  assertIsDefined(draft);
  assertIsDefined(draft.authKey);
  const result: AdminEntityCreate = {
    id: draftState.id,
    info: {
      type: draft.entitySpec.name,
      name: draft.name,
      authKey: draft.authKey,
    },
    fields: {},
  };

  //TODO add fields

  return result;
}

export function getEntityUpdateFromDraftState(draftState: EntityEditorDraftState) {
  const { draft, entity } = draftState;
  assertIsDefined(draft);
  assertIsDefined(entity);
  const result: AdminEntityUpdate = {
    id: draftState.id,
    info: {
      type: draft.entitySpec.name,
      ...(draft.name !== entity.info.name ? { name: draft.name } : {}),
    },
    fields: {},
  };

  //TODO add fields

  return result;
}
