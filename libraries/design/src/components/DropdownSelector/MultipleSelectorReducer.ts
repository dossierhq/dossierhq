import type { Reducer } from 'react';
import isEqual from 'lodash/isEqual.js';

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
  reduce(state: Readonly<MultipleSelectorState<TItem>>): Readonly<MultipleSelectorState<TItem>>;
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
  state: Readonly<MultipleSelectorState<TItem>>,
  action: MultipleSelectorStateAction<TItem>
): Readonly<MultipleSelectorState<TItem>> {
  const newState = action.reduce(state);
  return newState;
}

// Actions

class ClearSelectionAction<TItem extends MultipleSelectorItem>
  implements MultipleSelectorStateAction<TItem>
{
  reduce(state: Readonly<MultipleSelectorState<TItem>>): Readonly<MultipleSelectorState<TItem>> {
    if (state.selectedIds.length === 0) {
      return state;
    }
    return { ...state, selectedIds: [] };
  }
}

class SetSelectionAction<TItem extends MultipleSelectorItem>
  implements MultipleSelectorStateAction<TItem>
{
  private readonly selectedIds: string[];

  constructor(selectedIds: string[]) {
    this.selectedIds = selectedIds;
  }

  reduce(state: Readonly<MultipleSelectorState<TItem>>): Readonly<MultipleSelectorState<TItem>> {
    if (isEqual(this.selectedIds, state.selectedIds)) {
      return state;
    }
    return { ...state, selectedIds: [...this.selectedIds] };
  }
}

class ToggleItemAction<TItem extends MultipleSelectorItem>
  implements MultipleSelectorStateAction<TItem>
{
  private readonly id: TItem['id'];

  constructor(id: TItem['id']) {
    this.id = id;
  }

  reduce(state: Readonly<MultipleSelectorState<TItem>>): Readonly<MultipleSelectorState<TItem>> {
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

  reduce(state: Readonly<MultipleSelectorState<TItem>>): Readonly<MultipleSelectorState<TItem>> {
    const selectedIds = state.selectedIds.filter((id) => this.items.some((it) => it.id === id));
    if (isEqual(selectedIds, state.selectedIds) && isEqual(this.items, state.items)) {
      return state;
    }
    return { ...state, items: this.items, selectedIds };
  }
}

export const MultipleSelectorStateActions = {
  ClearSelection: ClearSelectionAction,
  SetSelection: SetSelectionAction,
  ToggleItem: ToggleItemAction,
  UpdateItems: UpdateItemsAction,
};
