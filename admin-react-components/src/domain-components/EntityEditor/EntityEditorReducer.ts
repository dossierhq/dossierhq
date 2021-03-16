import type {
  AdminEntity,
  EntityTypeSpecification,
  FieldSpecification,
  Schema,
} from '@datadata/core';
import isEqual from 'lodash/isEqual';
import { v4 as uuidv4 } from 'uuid';
import type { MessageItem } from '../../generic-components/Message/Message';

export type EntityEditorSelector = { id: string } | { id?: string; newType: string };

export interface EntityEditorState {
  schema: Schema;
  drafts: EntityEditorDraftState[];
}

export interface EntityEditorDraftState {
  id: string;
  initMessage: MessageItem | null;
  entityLoadMessage: MessageItem | null;
  entity: null | {
    version: number;
    entitySpec: EntityTypeSpecification;
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
    const id = this.#entitySelector.id ?? uuidv4();
    let message: MessageItem | null = null;
    let entity: EntityEditorDraftState['entity'] = null;
    if ('newType' in this.#entitySelector) {
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
    };

    return { ...state, drafts: [...state.drafts, draft] };
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
  #message: MessageItem | null;

  constructor(id: string, message: MessageItem | null) {
    super(id);
    this.#message = message;
  }

  reduceDraft(
    draftState: EntityEditorDraftState,
    _state: EntityEditorState
  ): EntityEditorDraftState {
    if (isEqual(draftState.entityLoadMessage, this.#message)) {
      return draftState;
    }
    if (draftState.entity?.version === 0 && this.#message) {
      // Skip loading entity error for new entity
      return draftState;
    }
    return {
      ...draftState,
      entityLoadMessage: this.#message,
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
    const entitySpec = state.schema.getEntityTypeSpecification(this.#entity._type);
    if (!entitySpec) {
      return {
        ...draftState,
        initMessage: {
          kind: 'danger',
          message: `Can't create entity with unsupported type: ${this.#entity._type}`,
        },
      };
    }

    return {
      ...draftState,
      entity: createEditorEntityDraftState(entitySpec, this.#entity),
    };
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

export function reduceEntityEditorState(
  state: EntityEditorState,
  action: EntityEditorStateAction
): EntityEditorState {
  return action.reduce(state);
}

export function initializeEntityEditorState({ schema }: { schema: Schema }): EntityEditorState {
  return { schema, drafts: [] };
}

function createEditorEntityDraftState(
  entitySpec: EntityTypeSpecification,
  entity: AdminEntity | null
): EntityEditorDraftState['entity'] {
  const fields = entitySpec.fields.map((fieldSpec) => {
    const value = entity?.[fieldSpec.name] ?? null;
    return { fieldSpec, value, initialValue: value };
  });
  return {
    entitySpec,
    version: entity ? entity._version + 1 : 0,
    name: entity?._name ?? '',
    initialName: entity?._name ?? '',
    fields,
  };
}
