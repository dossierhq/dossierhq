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

export type EntityEditorStateAction =
  | SetMessageLoadMessageAction
  | UpdateEntityAction
  | SetNameAction
  | SetFieldAction;

interface SetMessageLoadMessageAction {
  type: 'setEntityLoadMessage';
  message: MessageItem | null;
}

interface UpdateEntityAction {
  type: 'updateEntity';
  entity: AdminEntity;
}

interface SetNameAction {
  type: 'setName';
  name: string;
}

interface SetFieldAction {
  type: 'setField';
  field: string;
  value: unknown;
}

function isSetEntityLoadMessageAction(
  action: EntityEditorStateAction
): action is SetMessageLoadMessageAction {
  return action.type === 'setEntityLoadMessage';
}

function isUpdateEntityAction(action: EntityEditorStateAction): action is UpdateEntityAction {
  return action.type === 'updateEntity';
}

function isSetNameAction(action: EntityEditorStateAction): action is SetNameAction {
  return action.type === 'setName';
}

function isSetFieldAction(action: EntityEditorStateAction): action is SetFieldAction {
  return action.type === 'setField';
}

export function reduceEditorState(
  state: EntityEditorState,
  action: EntityEditorStateAction
): EntityEditorState {
  if (isSetEntityLoadMessageAction(action)) {
    if (isEqual(state.entityLoadMessage, action.message)) {
      return state;
    }
    return {
      ...state,
      entityLoadMessage: action.message,
    };
  }
  if (isUpdateEntityAction(action)) {
    const { entity } = action;
    if (state.entity) {
      //TODO handle subsequent update of entity
      return state;
    }
    const entitySpec = state.schema.getEntityTypeSpecification(entity._type);
    if (!entitySpec) {
      return {
        ...state,
        initMessage: {
          kind: 'danger',
          message: `Can't create entity with unsupported type: ${entity._type}`,
        },
      };
    }

    return {
      ...state,
      entity: createEditorState(entitySpec, entity),
    };
  }
  if (isSetNameAction(action)) {
    const { entity } = state;
    if (!entity) throw new Error('Unexpected state, no entity');
    return { ...state, entity: { ...entity, name: action.name } };
  }
  if (isSetFieldAction(action)) {
    const { entity } = state;
    if (!entity) throw new Error('Unexpected state, no entity');
    const fields = [...entity.fields];
    const index = fields.findIndex((x) => x.fieldSpec.name === action.field);
    if (index < 0) throw new Error(`Invalid field ${action.field}`);
    fields[index] = { ...fields[index], value: action.value };
    return { ...state, entity: { ...entity, fields } };
  }
  return state;
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
      dispatchEditorState({ type: 'updateEntity', entity });
    }
  }, [entity]);
  useEffect(() => {
    dispatchEditorState({
      type: 'setEntityLoadMessage',
      message: entityError
        ? {
            kind: 'danger',
            title: 'Failed loading entity',
            message: `${entityError.error}: ${entityError.message}`,
          }
        : null,
    });
  }, [entityError]);

  return { editorState, dispatchEditorState };
}
