import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityTypeSpecification,
  AdminEntityUpdate,
  AdminSchema,
  FieldSpecification,
} from '@jonasb/datadata-core';
import { assertIsDefined, normalizeFieldValue } from '@jonasb/datadata-core';
import isEqual from 'lodash/isEqual';
import { v4 as uuidv4 } from 'uuid';

type EntityEditorSelector = { id: string } | { id?: string; newType: string };

export interface EntityEditorState {
  status: '' | 'changed';
  schema: AdminSchema | null;
  drafts: EntityEditorDraftState[];
  activeEntityId: string | null;
  activeEntityEditorScrollSignal: number;
  activeEntityMenuScrollSignal: number;
}

export interface EntityEditorDraftState {
  id: string;
  status: '' | 'changed';
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
  status: '' | 'changed';
  fieldSpec: FieldSpecification;
  value: unknown;
  normalizedValue: unknown;
}

export interface EntityEditorStateAction {
  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState>;
}

export function initializeEntityEditorState(): EntityEditorState {
  return {
    status: '',
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

// STATUS RESOLVES

function resolveEditorStatus(state: EntityEditorState): EntityEditorState['status'] {
  const someChanged = state.drafts.some((it) => it.status === 'changed');
  return someChanged ? 'changed' : '';
}

function resolveDraftStatus(draftState: EntityEditorDraftState): EntityEditorDraftState['status'] {
  if (!draftState.draft) {
    return '';
  }
  if (!draftState.entity) {
    if (draftState.draft.authKey !== null || !draftState.draft.name) {
      return 'changed';
    }
  } else {
    if (draftState.draft.name !== draftState.entity.info.name) {
      return 'changed';
    }
  }

  const someChangedField = draftState.draft.fields.some((it) => it.status === 'changed');
  if (someChangedField) {
    return 'changed';
  }
  return '';
}

function resolveFieldStatus(
  field: FieldEditorState,
  draftState: EntityEditorDraftState
): FieldEditorState['status'] {
  const isEmpty = field.normalizedValue === null;
  if (!draftState.entity) {
    return isEmpty ? '' : 'changed';
  }

  const existingValue = draftState.entity.fields[field.fieldSpec.name];
  return isEqual(existingValue, field.normalizedValue) ? '' : 'changed';
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

    let newDraft = this.reduceDraft(currentDraft, state);
    if (newDraft === currentDraft) {
      return state;
    }

    newDraft = { ...newDraft, status: resolveDraftStatus(newDraft) };

    const newDrafts = [...state.drafts];
    newDrafts[draftIndex] = newDraft;

    const newState = { ...state, drafts: newDrafts };
    newState.status = resolveEditorStatus(newState);
    return newState;
  }

  abstract reduceDraft(
    draftState: Readonly<EntityEditorDraftState>,
    editorState: Readonly<EntityEditorState>
  ): Readonly<EntityEditorDraftState>;
}

abstract class EntityEditorFieldAction extends EntityEditorDraftAction {
  fieldName: string;

  constructor(entryId: string, fieldName: string) {
    super(entryId);
    this.fieldName = fieldName;
  }

  reduceDraft(
    draftState: Readonly<EntityEditorDraftState>,
    editorState: Readonly<EntityEditorState>
  ): Readonly<EntityEditorDraftState> {
    assertIsDefined(draftState.draft);
    const fieldIndex = draftState.draft.fields.findIndex(
      (it) => it.fieldSpec.name === this.fieldName
    );
    if (fieldIndex < 0) {
      throw new Error(`No such field ${this.fieldName} for entity with id ${this.id}`);
    }
    const currentField = draftState.draft.fields[fieldIndex];

    let newField = this.reduceField(currentField, draftState, editorState);
    if (newField === currentField) {
      return draftState;
    }
    newField = { ...newField, status: resolveFieldStatus(newField, draftState) };

    const newFields = [...draftState.draft.fields];
    newFields[fieldIndex] = newField;

    return { ...draftState, draft: { ...draftState.draft, fields: newFields } };
  }

  abstract reduceField(
    fieldState: Readonly<FieldEditorState>,
    draftState: Readonly<EntityEditorDraftState>,
    editorState: Readonly<EntityEditorState>
  ): Readonly<FieldEditorState>;
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
      status: '',
      draft: null,
      entity: null,
      entityWillBeUpdatedDueToUpsert: false,
    };
    if ('newType' in this.selector) {
      const entitySpec = schema.getEntityTypeSpecification(this.selector.newType);
      assertIsDefined(entitySpec);
      draft.draft = createEditorEntityDraftState(schema, entitySpec, null);
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

class DeleteDraftAction implements EntityEditorStateAction {
  id: string;
  constructor(id: string) {
    this.id = id;
  }

  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState> {
    let { activeEntityId } = state;
    if (activeEntityId === this.id) {
      activeEntityId = null;
    }

    return {
      ...state,
      activeEntityId,
      drafts: state.drafts.filter((it) => it.id !== this.id),
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

class SetFieldAction extends EntityEditorFieldAction {
  value: unknown;

  constructor(entityId: string, fieldName: string, value: unknown) {
    super(entityId, fieldName);
    this.value = value;
  }

  reduceField(
    fieldState: Readonly<FieldEditorState>,
    draftState: Readonly<EntityEditorDraftState>,
    editorState: Readonly<EntityEditorState>
  ): Readonly<FieldEditorState> {
    const { schema } = editorState;
    assertIsDefined(schema);
    if (fieldState.value === this.value) {
      return fieldState;
    }

    const normalizedValue = normalizeFieldValue(schema, fieldState.fieldSpec, this.value);
    return { ...fieldState, value: this.value, normalizedValue };
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
      draft: createEditorEntityDraftState(schema, entitySpec, this.entity),
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
  DeleteDraft: DeleteDraftAction,
  SetActiveEntity: SetActiveEntityAction,
  SetAuthKey: SetAuthKeyAction,
  SetField: SetFieldAction,
  SetName: SetNameAction,
  SetNextEntityUpdateIsDueToUpsert: SetNextEntityUpdateIsDueToUpsertAction,
  UpdateEntity: UpdateEntityAction,
  UpdateSchemaSpecification: UpdateSchemaSpecificationAction,
};

// HELPERS

function createEditorEntityDraftState(
  schema: AdminSchema,
  entitySpec: AdminEntityTypeSpecification,
  entity: AdminEntity | null
): EntityEditorDraftState['draft'] {
  const fields = entitySpec.fields.map<FieldEditorState>((fieldSpec) => {
    const value = entity?.fields[fieldSpec.name] ?? null;
    const normalizedValue = normalizeFieldValue(schema, fieldSpec, value);
    return { status: '', fieldSpec, value, normalizedValue };
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

  const fields: AdminEntityCreate['fields'] = {};
  for (const field of draft.fields) {
    fields[field.fieldSpec.name] = field.value;
  }

  const result: AdminEntityCreate = {
    id: draftState.id,
    info: {
      type: draft.entitySpec.name,
      name: draft.name,
      authKey: draft.authKey,
    },
    fields,
  };

  return result;
}

export function getEntityUpdateFromDraftState(draftState: EntityEditorDraftState) {
  const { draft, entity } = draftState;
  assertIsDefined(draft);
  assertIsDefined(entity);

  const fields: AdminEntityCreate['fields'] = {};
  for (const field of draft.fields) {
    fields[field.fieldSpec.name] = field.value;
  }

  const result: AdminEntityUpdate = {
    id: draftState.id,
    info: {
      type: draft.entitySpec.name,
      ...(draft.name !== entity.info.name ? { name: draft.name } : {}),
    },
    fields,
  };

  return result;
}
