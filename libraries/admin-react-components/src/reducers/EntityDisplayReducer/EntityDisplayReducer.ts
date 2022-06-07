export interface EntityDisplayState {
  entityIds: string[];
  activeEntityId: string | null;
  activeEntityEditorScrollSignal: number;
  activeEntityMenuScrollSignal: number;
}

export interface EntityDisplayStateAction {
  reduce(state: Readonly<EntityDisplayState>): Readonly<EntityDisplayState>;
}

export function initializeEntityDisplayState(entityIds: string[]): EntityDisplayState {
  return {
    entityIds: [...entityIds],
    activeEntityId: entityIds.length > 0 ? entityIds[0] : null,
    activeEntityEditorScrollSignal: 0,
    activeEntityMenuScrollSignal: 0,
  };
}

export function reduceEntityDisplayState(
  state: Readonly<EntityDisplayState>,
  action: EntityDisplayStateAction
): Readonly<EntityDisplayState> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

// ACTIONS

class AddEntityAction implements EntityDisplayStateAction {
  entityId: string;

  constructor(entityId: string) {
    this.entityId = entityId;
  }

  reduce(state: Readonly<EntityDisplayState>): Readonly<EntityDisplayState> {
    let { activeEntityEditorScrollSignal, activeEntityMenuScrollSignal } = state;

    if (state.entityIds.some((it) => it === this.entityId)) {
      activeEntityEditorScrollSignal++;
      activeEntityMenuScrollSignal++;

      return {
        ...state,
        activeEntityId: this.entityId,
        activeEntityEditorScrollSignal,
        activeEntityMenuScrollSignal,
      };
    }
    return { ...state, entityIds: [...state.entityIds, this.entityId] };
  }
}

class RemoveEntityAction implements EntityDisplayStateAction {
  entityId: string;

  constructor(entityId: string) {
    this.entityId = entityId;
  }

  reduce(state: Readonly<EntityDisplayState>): Readonly<EntityDisplayState> {
    let { activeEntityId } = state;
    if (activeEntityId === this.entityId) {
      activeEntityId = null;
    }

    return {
      ...state,
      activeEntityId,
      entityIds: state.entityIds.filter((id) => id !== this.entityId),
    };
  }
}

class SetActiveEntityAction implements EntityDisplayStateAction {
  id: string;
  increaseMenuScrollSignal: boolean;
  increaseEditorScrollSignal: boolean;

  constructor(id: string, increaseMenuScrollSignal: boolean, increaseEditorScrollSignal: boolean) {
    this.id = id;
    this.increaseMenuScrollSignal = increaseMenuScrollSignal;
    this.increaseEditorScrollSignal = increaseEditorScrollSignal;
  }

  reduce(state: Readonly<EntityDisplayState>): Readonly<EntityDisplayState> {
    if (state.activeEntityId === this.id) {
      return state;
    }
    if (!state.entityIds.some((id) => id === this.id)) {
      throw new Error(`No entity with id '${this.id}`);
    }
    let { activeEntityMenuScrollSignal, activeEntityEditorScrollSignal } = state;
    if (this.increaseMenuScrollSignal) {
      activeEntityMenuScrollSignal += 1;
    }
    if (this.increaseEditorScrollSignal) {
      activeEntityEditorScrollSignal += 1;
    }

    return {
      ...state,
      activeEntityId: this.id,
      activeEntityMenuScrollSignal,
      activeEntityEditorScrollSignal,
    };
  }
}

export const EntityDisplayActions = {
  AddEntity: AddEntityAction,
  RemoveEntity: RemoveEntityAction,
  SetActiveEntity: SetActiveEntityAction,
};
