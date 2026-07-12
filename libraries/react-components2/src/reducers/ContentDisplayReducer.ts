export interface ContentDisplayState {
  entityIds: string[];
  activeEntityId: string | null;
  activeEntityDisplayScrollSignal: number;
  activeEntityMenuScrollSignal: number;
}

export interface ContentDisplayStateAction {
  reduce(state: Readonly<ContentDisplayState>): Readonly<ContentDisplayState>;
}

export function initializeContentDisplayState(entityIds: string[]): ContentDisplayState {
  return {
    entityIds: [...entityIds],
    activeEntityId: entityIds.length > 0 ? entityIds[0] : null,
    activeEntityDisplayScrollSignal: 0,
    activeEntityMenuScrollSignal: 0,
  };
}

export function reduceContentDisplayState(
  state: Readonly<ContentDisplayState>,
  action: ContentDisplayStateAction,
): Readonly<ContentDisplayState> {
  return action.reduce(state);
}

// ACTIONS

class AddEntityAction implements ContentDisplayStateAction {
  entityId: string;

  constructor(entityId: string) {
    this.entityId = entityId;
  }

  reduce(state: Readonly<ContentDisplayState>): Readonly<ContentDisplayState> {
    let { activeEntityDisplayScrollSignal, activeEntityMenuScrollSignal } = state;

    if (state.entityIds.some((it) => it === this.entityId)) {
      activeEntityDisplayScrollSignal++;
      activeEntityMenuScrollSignal++;

      return {
        ...state,
        activeEntityId: this.entityId,
        activeEntityDisplayScrollSignal,
        activeEntityMenuScrollSignal,
      };
    }
    return { ...state, entityIds: [...state.entityIds, this.entityId] };
  }
}

class RemoveEntityAction implements ContentDisplayStateAction {
  entityId: string;

  constructor(entityId: string) {
    this.entityId = entityId;
  }

  reduce(state: Readonly<ContentDisplayState>): Readonly<ContentDisplayState> {
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

class SetActiveEntityAction implements ContentDisplayStateAction {
  id: string;
  increaseMenuScrollSignal: boolean;
  increaseDisplayScrollSignal: boolean;

  constructor(id: string, increaseMenuScrollSignal: boolean, increaseDisplayScrollSignal: boolean) {
    this.id = id;
    this.increaseMenuScrollSignal = increaseMenuScrollSignal;
    this.increaseDisplayScrollSignal = increaseDisplayScrollSignal;
  }

  reduce(state: Readonly<ContentDisplayState>): Readonly<ContentDisplayState> {
    if (state.activeEntityId === this.id) {
      return state;
    }
    if (!state.entityIds.some((id) => id === this.id)) {
      throw new Error(`No entity with id '${this.id}`);
    }
    let { activeEntityMenuScrollSignal, activeEntityDisplayScrollSignal } = state;
    if (this.increaseMenuScrollSignal) {
      activeEntityMenuScrollSignal += 1;
    }
    if (this.increaseDisplayScrollSignal) {
      activeEntityDisplayScrollSignal += 1;
    }

    return {
      ...state,
      activeEntityId: this.id,
      activeEntityMenuScrollSignal,
      activeEntityDisplayScrollSignal,
    };
  }
}

export const ContentDisplayActions = {
  AddEntity: AddEntityAction,
  RemoveEntity: RemoveEntityAction,
  SetActiveEntity: SetActiveEntityAction,
};
