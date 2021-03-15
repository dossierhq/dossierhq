import type {
  AdminEntity,
  EntityTypeSpecification,
  FieldSpecification,
  Schema,
} from '@datadata/core';
import isEqual from 'lodash/isEqual';
import type { Dispatch } from 'react';
import { useEffect, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { DataDataContextValue } from '../..';
import type { MessageItem } from '../../generic-components/Message/Message';

export type EntitySelector = { id: string } | { id?: string; newType: string };

export interface EntityEditorState {
  initMessage: MessageItem | null;
  entityLoadMessage: MessageItem | null;
  schema: Schema;
  id: string;
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

export class SetMessageLoadMessageAction implements EntityEditorStateAction {
  #message: MessageItem | null;

  constructor(message: MessageItem | null) {
    this.#message = message;
  }

  reduce(state: EntityEditorState): EntityEditorState {
    if (isEqual(state.entityLoadMessage, this.#message)) {
      return state;
    }
    if (state.entity?.version === 0 && this.#message) {
      // Skip loading entity error for new entity
      return state;
    }
    return {
      ...state,
      entityLoadMessage: this.#message,
    };
  }
}

export class UpdateEntityAction implements EntityEditorStateAction {
  #entity: AdminEntity;

  constructor(entity: AdminEntity) {
    this.#entity = entity;
  }

  reduce(state: EntityEditorState): EntityEditorState {
    //TODO handle update when there are local changes
    const entitySpec = state.schema.getEntityTypeSpecification(this.#entity._type);
    if (!entitySpec) {
      return {
        ...state,
        initMessage: {
          kind: 'danger',
          message: `Can't create entity with unsupported type: ${this.#entity._type}`,
        },
      };
    }

    return {
      ...state,
      entity: createEditorState(entitySpec, this.#entity),
    };
  }
}

export class SetNameAction implements EntityEditorStateAction {
  #name: string;

  constructor(name: string) {
    this.#name = name;
  }

  reduce(state: EntityEditorState): EntityEditorState {
    const { entity } = state;
    if (!entity) {
      throw new Error('Unexpected state, no entity');
    }
    return { ...state, entity: { ...entity, name: this.#name } };
  }
}

export class SetFieldAction implements EntityEditorStateAction {
  #field: string;
  #value: unknown;

  constructor(field: string, value: unknown) {
    this.#field = field;
    this.#value = value;
  }

  reduce(state: EntityEditorState): EntityEditorState {
    const { entity } = state;
    if (!entity) throw new Error('Unexpected state, no entity');
    const fields = [...entity.fields];
    const index = fields.findIndex((x) => x.fieldSpec.name === this.#field);
    if (index < 0) throw new Error(`Invalid field ${this.#field}`);
    fields[index] = { ...fields[index], value: this.#value };
    return { ...state, entity: { ...entity, fields } };
  }
}

export function reduceEditorState(
  state: EntityEditorState,
  action: EntityEditorStateAction
): EntityEditorState {
  return action.reduce(state);
}

function initializeState({
  entitySelector,
  contextValue,
}: {
  entitySelector: EntitySelector;
  contextValue: DataDataContextValue;
}): EntityEditorState {
  const { schema } = contextValue;
  const id = entitySelector.id ?? uuidv4();
  let message: MessageItem | null = null;
  let entity: EntityEditorState['entity'] = null;
  if ('newType' in entitySelector) {
    const entitySpec = contextValue.schema.getEntityTypeSpecification(entitySelector.newType);
    if (entitySpec) {
      entity = createEditorState(entitySpec, null);
    } else {
      message = {
        kind: 'danger',
        message: `Can't create entity with unsupported type: ${entitySelector.newType}`,
      };
    }
  }

  return { initMessage: message, entityLoadMessage: null, schema, id, entity };
}

function createEditorState(
  entitySpec: EntityTypeSpecification,
  entity: AdminEntity | null
): EntityEditorState['entity'] {
  const fields = entitySpec.fields.map((fieldSpec) => {
    const value = entity?.[fieldSpec.name] ?? null;
    return { fieldSpec, value, initialValue: value };
  });
  return {
    entitySpec,
    version: entity?._version ?? 0,
    name: entity?._name ?? '',
    initialName: entity?._name ?? '',
    fields,
  };
}

export function useEntityEditorState(
  entitySelector: EntitySelector,
  contextValue: DataDataContextValue
): { editorState: EntityEditorState; dispatchEditorState: Dispatch<EntityEditorStateAction> } {
  const { useEntity } = contextValue;
  const [editorState, dispatchEditorState] = useReducer(
    reduceEditorState,
    { entitySelector, contextValue },
    initializeState
  );
  const { entity, entityError } = useEntity(editorState.id);

  useEffect(() => {
    if (entity) {
      dispatchEditorState(new UpdateEntityAction(entity));
    }
  }, [entity]);
  useEffect(() => {
    dispatchEditorState(
      new SetMessageLoadMessageAction(
        entityError
          ? {
              kind: 'danger',
              title: 'Failed loading entity',
              message: `${entityError.error}: ${entityError.message}`,
            }
          : null
      )
    );
  }, [entityError]);

  return { editorState, dispatchEditorState };
}
