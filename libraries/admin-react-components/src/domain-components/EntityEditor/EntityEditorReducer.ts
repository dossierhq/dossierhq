import type {
  AdminEntity,
  AdminEntityStatus,
  AdminEntityTypeSpecification,
  FieldSpecification,
  AdminSchema,
} from '@jonasb/datadata-core';
import { ErrorType } from '@jonasb/datadata-core';
import isEqual from 'lodash/isEqual';
import { v4 as uuidv4 } from 'uuid';
import type { MessageItem } from '../../generic-components/Message/Message';

export type EntityEditorSelector = { id: string } | { id?: string; newType: string };

export interface EntityEditorState {
  schema: AdminSchema;
  drafts: EntityEditorDraftState[];
  activeEntityId: string | null;
}

export interface EntityEditorDraftState {
  id: string;
  initMessage: MessageItem | null;
  entityLoadMessage: MessageItem | null;
  exists: boolean;
  status: AdminEntityStatus | null;
  latestServerVersion: number | null;
  entity: null | {
    version: number;
    entitySpec: AdminEntityTypeSpecification;
    authKey: string | null;
    name: string;
    initialName: string;
    fields: FieldEditorState[];
  };
}

interface FieldEditorState {
  fieldSpec: FieldSpecification;
  value: unknown;
  initialValue: unknown;
}

export interface EntityEditorStateAction {
  reduce(state: EntityEditorState): EntityEditorState;
}

export class AddEntityDraftAction implements EntityEditorStateAction {
  #entitySelector: EntityEditorSelector;
  constructor(entitySelector: EntityEditorSelector) {
    this.#entitySelector = entitySelector;
  }

  reduce(state: EntityEditorState): EntityEditorState {
    if (this.#entitySelector.id && state.drafts.some((it) => it.id === this.#entitySelector.id)) {
      return state;
    }
    const id = this.#entitySelector.id ?? uuidv4();
    let message: MessageItem | null = null;
    let entity: EntityEditorDraftState['entity'] = null;
    let exists = true;
    if ('newType' in this.#entitySelector) {
      exists = false;
      const type = this.#entitySelector.newType;
      const entitySpec = state.schema.getEntityTypeSpecification(type);
      if (entitySpec) {
        entity = createEditorEntityDraftState(entitySpec, null);
      } else {
        message = {
          kind: 'danger',
          message: `Can't create entity with unsupported type: ${type}`,
        };
      }
    }

    const draft: EntityEditorDraftState = {
      initMessage: message,
      entityLoadMessage: null,
      id,
      entity,
      exists,
      status: null,
      latestServerVersion: null,
    };

    return {
      ...state,
      drafts: [...state.drafts, draft],
      activeEntityId: state.activeEntityId ?? id,
    };
  }
}

export class SetActiveEntityAction implements EntityEditorStateAction {
  #entityId: string | null;
  constructor(entityId: string | null) {
    this.#entityId = entityId;
  }

  reduce(state: EntityEditorState): EntityEditorState {
    return { ...state, activeEntityId: this.#entityId };
  }
}

abstract class EntityEditorDraftStateAction implements EntityEditorStateAction {
  #id: string;

  constructor(id: string) {
    this.#id = id;
  }

  reduce(state: EntityEditorState): EntityEditorState {
    const draftIndex = state.drafts.findIndex((x) => x.id === this.#id);
    if (draftIndex < 0) {
      throw new Error(`Can't find draft for ${this.#id}`);
    }
    const draftState = state.drafts[draftIndex];
    const newDraftState = this.reduceDraft(draftState, state);
    if (draftState === newDraftState) {
      return state;
    }
    const newDrafts = [...state.drafts];
    newDrafts[draftIndex] = newDraftState;
    return { ...state, drafts: newDrafts };
  }

  abstract reduceDraft(
    draftState: EntityEditorDraftState,
    state: EntityEditorState
  ): EntityEditorDraftState;
}

export class SetMessageLoadMessageAction extends EntityEditorDraftStateAction {
  #errorType: ErrorType | null;
  #message: MessageItem | null;

  constructor(id: string, errorType: ErrorType | null, message: MessageItem | null) {
    super(id);
    this.#errorType = errorType;
    this.#message = message;
  }

  reduceDraft(
    draftState: EntityEditorDraftState,
    _state: EntityEditorState
  ): EntityEditorDraftState {
    const permanentError = this.#errorType === ErrorType.NotFound;
    const changeExists = draftState.exists && permanentError;
    if (isEqual(draftState.entityLoadMessage, this.#message) && !changeExists) {
      return draftState;
    }
    return {
      ...draftState,
      entityLoadMessage: this.#message,
      ...(changeExists ? { exists: false } : undefined),
    };
  }
}

export class UpdateEntityAction extends EntityEditorDraftStateAction {
  #entity: AdminEntity;

  constructor(id: string, entity: AdminEntity) {
    super(id);
    this.#entity = entity;
  }

  reduceDraft(
    draftState: EntityEditorDraftState,
    state: EntityEditorState
  ): EntityEditorDraftState {
    //TODO handle update when there are local changes
    const entitySpec = state.schema.getEntityTypeSpecification(this.#entity.info.type);
    if (!entitySpec) {
      return {
        ...draftState,
        initMessage: {
          kind: 'danger',
          message: `Can't create entity with unsupported type: ${this.#entity.info.type}`,
        },
      };
    }

    return {
      ...draftState,
      status: this.#entity.info.status,
      latestServerVersion: this.#entity.info.version,
      entity: createEditorEntityDraftState(entitySpec, this.#entity),
    };
  }
}

export class SetAuthKeyAction extends EntityEditorDraftStateAction {
  #authKey: string;

  constructor(id: string, authKey: string) {
    super(id);
    this.#authKey = authKey;
  }

  reduceDraft(
    draftState: EntityEditorDraftState,
    _state: EntityEditorState
  ): EntityEditorDraftState {
    const { entity } = draftState;
    if (!entity) {
      throw new Error('Unexpected state, no entity');
    }
    return { ...draftState, entity: { ...entity, authKey: this.#authKey } };
  }
}

export class SetNameAction extends EntityEditorDraftStateAction {
  #name: string;

  constructor(id: string, name: string) {
    super(id);
    this.#name = name;
  }

  reduceDraft(
    draftState: EntityEditorDraftState,
    _state: EntityEditorState
  ): EntityEditorDraftState {
    const { entity } = draftState;
    if (!entity) {
      throw new Error('Unexpected state, no entity');
    }
    return { ...draftState, entity: { ...entity, name: this.#name } };
  }
}

export class SetFieldAction extends EntityEditorDraftStateAction {
  #field: string;
  #value: unknown;

  constructor(id: string, field: string, value: unknown) {
    super(id);
    this.#field = field;
    this.#value = value;
  }

  reduceDraft(
    draftState: EntityEditorDraftState,
    _state: EntityEditorState
  ): EntityEditorDraftState {
    const { entity } = draftState;
    if (!entity) throw new Error('Unexpected state, no entity');
    const fields = [...entity.fields];
    const index = fields.findIndex((x) => x.fieldSpec.name === this.#field);
    if (index < 0) throw new Error(`Invalid field ${this.#field}`);
    fields[index] = { ...fields[index], value: this.#value };
    return { ...draftState, entity: { ...entity, fields } };
  }
}

export class EntityUpsertedAction extends EntityEditorDraftStateAction {
  constructor(id: string) {
    super(id);
  }

  reduceDraft(
    draftState: EntityEditorDraftState,
    _state: EntityEditorState
  ): EntityEditorDraftState {
    if (draftState.exists) {
      return draftState;
    }
    return { ...draftState, exists: true };
  }
}

export class ResetEntityAction extends EntityEditorDraftStateAction {
  constructor(id: string) {
    super(id);
  }

  reduceDraft(
    draftState: EntityEditorDraftState,
    _state: EntityEditorState
  ): EntityEditorDraftState {
    const { entity } = draftState;
    if (!entity) {
      return draftState;
    }
    const newEntity = { ...entity };
    newEntity.name = newEntity.initialName;
    newEntity.fields = newEntity.fields.map((field) => ({ ...field, value: field.initialValue }));
    return { ...draftState, entity: newEntity };
  }
}

export function reduceEntityEditorState(
  state: EntityEditorState,
  action: EntityEditorStateAction
): EntityEditorState {
  return action.reduce(state);
}

export function initializeEntityEditorState({
  schema,
  actions,
}: {
  schema: AdminSchema;
  actions?: EntityEditorStateAction[];
}): EntityEditorState {
  let state: EntityEditorState = { schema, drafts: [], activeEntityId: null };
  if (actions) {
    for (const action of actions) {
      state = reduceEntityEditorState(state, action);
    }
  }
  return state;
}

function createEditorEntityDraftState(
  entitySpec: AdminEntityTypeSpecification,
  entity: AdminEntity | null
): EntityEditorDraftState['entity'] {
  const fields = entitySpec.fields.map((fieldSpec) => {
    const value = entity?.fields[fieldSpec.name] ?? null;
    return { fieldSpec, value, initialValue: value };
  });
  return {
    entitySpec,
    authKey: entity?.info.authKey ?? null,
    version: entity ? entity.info.version + 1 : 0,
    name: entity?.info.name ?? '',
    initialName: entity?.info.name ?? '',
    fields,
  };
}
