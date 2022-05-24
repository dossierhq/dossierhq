import type {
  AdminEntity,
  AdminEntityStatus,
  AdminEntityTypeSpecification,
  FieldSpecification,
  AdminSchema,
} from '@jonasb/datadata-core';
import { ErrorType } from '@jonasb/datadata-core';
import isEqual from 'lodash/isEqual';
import type { MessageItem } from '../../generic-components/Message/Message';

export type LegacyEntityEditorSelector = { id: string } | { id?: string; newType: string };

export interface LegacyEntityEditorState {
  schema: AdminSchema;
  drafts: LegacyEntityEditorDraftState[];
  activeEntityId: string | null;
}

export interface LegacyEntityEditorDraftState {
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

export interface LegacyEntityEditorStateAction {
  reduce(state: LegacyEntityEditorState): LegacyEntityEditorState;
}

export class LegacyAddEntityDraftAction implements LegacyEntityEditorStateAction {
  #entitySelector: LegacyEntityEditorSelector;
  constructor(entitySelector: LegacyEntityEditorSelector) {
    this.#entitySelector = entitySelector;
  }

  reduce(state: LegacyEntityEditorState): LegacyEntityEditorState {
    if (this.#entitySelector.id && state.drafts.some((it) => it.id === this.#entitySelector.id)) {
      return state;
    }
    const id = this.#entitySelector.id ?? crypto.randomUUID();
    let message: MessageItem | null = null;
    let entity: LegacyEntityEditorDraftState['entity'] = null;
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

    const draft: LegacyEntityEditorDraftState = {
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

export class LegacySetActiveEntityAction implements LegacyEntityEditorStateAction {
  #entityId: string | null;
  constructor(entityId: string | null) {
    this.#entityId = entityId;
  }

  reduce(state: LegacyEntityEditorState): LegacyEntityEditorState {
    return { ...state, activeEntityId: this.#entityId };
  }
}

abstract class EntityEditorDraftStateAction implements LegacyEntityEditorStateAction {
  #id: string;

  constructor(id: string) {
    this.#id = id;
  }

  reduce(state: LegacyEntityEditorState): LegacyEntityEditorState {
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
    draftState: LegacyEntityEditorDraftState,
    state: LegacyEntityEditorState
  ): LegacyEntityEditorDraftState;
}

export class LegacySetMessageLoadMessageAction extends EntityEditorDraftStateAction {
  #errorType: ErrorType | null;
  #message: MessageItem | null;

  constructor(id: string, errorType: ErrorType | null, message: MessageItem | null) {
    super(id);
    this.#errorType = errorType;
    this.#message = message;
  }

  reduceDraft(
    draftState: LegacyEntityEditorDraftState,
    _state: LegacyEntityEditorState
  ): LegacyEntityEditorDraftState {
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

export class LegacyUpdateEntityAction extends EntityEditorDraftStateAction {
  #entity: AdminEntity;

  constructor(id: string, entity: AdminEntity) {
    super(id);
    this.#entity = entity;
  }

  reduceDraft(
    draftState: LegacyEntityEditorDraftState,
    state: LegacyEntityEditorState
  ): LegacyEntityEditorDraftState {
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

export class LegacySetAuthKeyAction extends EntityEditorDraftStateAction {
  #authKey: string;

  constructor(id: string, authKey: string) {
    super(id);
    this.#authKey = authKey;
  }

  reduceDraft(
    draftState: LegacyEntityEditorDraftState,
    _state: LegacyEntityEditorState
  ): LegacyEntityEditorDraftState {
    const { entity } = draftState;
    if (!entity) {
      throw new Error('Unexpected state, no entity');
    }
    return { ...draftState, entity: { ...entity, authKey: this.#authKey } };
  }
}

export class LegacySetNameAction extends EntityEditorDraftStateAction {
  #name: string;

  constructor(id: string, name: string) {
    super(id);
    this.#name = name;
  }

  reduceDraft(
    draftState: LegacyEntityEditorDraftState,
    _state: LegacyEntityEditorState
  ): LegacyEntityEditorDraftState {
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
    draftState: LegacyEntityEditorDraftState,
    _state: LegacyEntityEditorState
  ): LegacyEntityEditorDraftState {
    const { entity } = draftState;
    if (!entity) throw new Error('Unexpected state, no entity');
    const fields = [...entity.fields];
    const index = fields.findIndex((x) => x.fieldSpec.name === this.#field);
    if (index < 0) throw new Error(`Invalid field ${this.#field}`);
    fields[index] = { ...fields[index], value: this.#value };
    return { ...draftState, entity: { ...entity, fields } };
  }
}

export class LegacyEntityUpsertedAction extends EntityEditorDraftStateAction {
  constructor(id: string) {
    super(id);
  }

  reduceDraft(
    draftState: LegacyEntityEditorDraftState,
    _state: LegacyEntityEditorState
  ): LegacyEntityEditorDraftState {
    if (draftState.exists) {
      return draftState;
    }
    return { ...draftState, exists: true };
  }
}

export class LegacyResetEntityAction extends EntityEditorDraftStateAction {
  constructor(id: string) {
    super(id);
  }

  reduceDraft(
    draftState: LegacyEntityEditorDraftState,
    _state: LegacyEntityEditorState
  ): LegacyEntityEditorDraftState {
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

export function reduceLegacyEntityEditorState(
  state: LegacyEntityEditorState,
  action: LegacyEntityEditorStateAction
): LegacyEntityEditorState {
  return action.reduce(state);
}

export function initializeLegacyEntityEditorState({
  schema,
  actions,
}: {
  schema: AdminSchema;
  actions?: LegacyEntityEditorStateAction[];
}): LegacyEntityEditorState {
  let state: LegacyEntityEditorState = { schema, drafts: [], activeEntityId: null };
  if (actions) {
    for (const action of actions) {
      state = reduceLegacyEntityEditorState(state, action);
    }
  }
  return state;
}

function createEditorEntityDraftState(
  entitySpec: AdminEntityTypeSpecification,
  entity: AdminEntity | null
): LegacyEntityEditorDraftState['entity'] {
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
