import type { Reducer } from 'react';

export interface MultipleSelectorItem<TId extends string = string> {
  id: TId;
}

export type MultipleSelectorReducer<TItem extends MultipleSelectorItem> = Reducer<
  MultipleSelectorState<TItem>,
  MultipleSelectorStateAction<TItem>
>;

export interface MultipleSelectorStateInitializerArgs<TItem extends MultipleSelectorItem> {
  items: TItem[];
  selectedIds?: Array<TItem['id']>;
}

export interface MultipleSelectorState<TItem extends MultipleSelectorItem> {
  items: TItem[];
  selectedIds: Array<TItem['id']>;
}

export interface MultipleSelectorStateAction<TItem extends MultipleSelectorItem> {
  reduce(state: MultipleSelectorState<TItem>): MultipleSelectorState<TItem>;
}

export function initializeMultipleSelectorState<TItem extends MultipleSelectorItem>({
  items,
  selectedIds,
}: MultipleSelectorStateInitializerArgs<TItem>): MultipleSelectorState<TItem> {
  return {
    items,
    selectedIds: selectedIds ?? [],
  };
}

export function reduceMultipleSelectorState<TItem extends MultipleSelectorItem>(
  state: MultipleSelectorState<TItem>,
  action: MultipleSelectorStateAction<TItem>
): MultipleSelectorState<TItem> {
  const newState = action.reduce(state);
  return newState;
}

// Actions

class ClearSelectionAction<TItem extends MultipleSelectorItem>
  implements MultipleSelectorStateAction<TItem>
{
  reduce(state: MultipleSelectorState<TItem>): MultipleSelectorState<TItem> {
    if (state.selectedIds.length === 0) {
      return state;
    }
    return { ...state, selectedIds: [] };
  }
}

class ToggleItemAction<TItem extends MultipleSelectorItem>
  implements MultipleSelectorStateAction<TItem>
{
  private readonly id: TItem['id'];

  constructor(id: TItem['id']) {
    this.id = id;
  }

  reduce(state: MultipleSelectorState<TItem>): MultipleSelectorState<TItem> {
    const index = state.selectedIds.indexOf(this.id);
    const selectedIds = [...state.selectedIds];
    if (index < 0) {
      selectedIds.push(this.id);
    } else {
      selectedIds.splice(index, 1);
    }
    const newState = { ...state, selectedIds };
    return newState;
  }
}

class UpdateItemsAction<TItem extends MultipleSelectorItem<TId>, TId extends string = string>
  implements MultipleSelectorStateAction<TItem>
{
  private readonly items: TItem[];

  constructor(items: TItem[]) {
    this.items = items;
  }

  reduce(state: MultipleSelectorState<TItem>): MultipleSelectorState<TItem> {
    const selectedIds = state.selectedIds.filter((id) => this.items.some((it) => it.id === id));
    return { ...state, items: this.items, selectedIds };
  }
}

export const MultipleSelectorStateActions = {
  ClearSelection: ClearSelectionAction,
  ToggleItem: ToggleItemAction,
  UpdateItems: UpdateItemsAction,
};
