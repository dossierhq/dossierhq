import type { Reducer } from 'react';

export interface MultipleSelectorItem<TId extends string = string> {
  id: TId;
}

export type MultipleSelectorReducer<
  TItem extends MultipleSelectorItem<TId>,
  TId extends string = string
> = Reducer<MultipleSelectorState<TItem, TId>, MultipleSelectorStateAction<TItem, TId>>;

export interface MultipleSelectorStateInitializerArgs<
  TItem extends MultipleSelectorItem<TId>,
  TId extends string = string
> {
  items: TItem[];
  selectedIds?: TId[];
}

export interface MultipleSelectorState<
  TItem extends MultipleSelectorItem<TId>,
  TId extends string = string
> {
  items: TItem[];
  selectedIds: TId[];
}

export interface MultipleSelectorStateAction<
  TItem extends MultipleSelectorItem<TId>,
  TId extends string = string
> {
  reduce(state: MultipleSelectorState<TItem, TId>): MultipleSelectorState<TItem, TId>;
}

export function initializeMultipleSelectorState<
  TItem extends MultipleSelectorItem<TId>,
  TId extends string = string
>({
  items,
  selectedIds,
}: MultipleSelectorStateInitializerArgs<TItem, TId>): MultipleSelectorState<TItem, TId> {
  return {
    items,
    selectedIds: selectedIds ?? [],
  };
}

export function reduceMultipleSelectorState<
  TItem extends MultipleSelectorItem<TId>,
  TId extends string = string
>(
  state: MultipleSelectorState<TItem, TId>,
  action: MultipleSelectorStateAction<TItem, TId>
): MultipleSelectorState<TItem, TId> {
  const newState = action.reduce(state);
  return newState;
}

// Actions

class ClearSelectionAction<TItem extends MultipleSelectorItem<TId>, TId extends string = string>
  implements MultipleSelectorStateAction<TItem>
{
  reduce(state: MultipleSelectorState<TItem>): MultipleSelectorState<TItem> {
    if (state.selectedIds.length === 0) {
      return state;
    }
    return { ...state, selectedIds: [] };
  }
}

class ToggleItemAction<TItem extends MultipleSelectorItem<TId>, TId extends string = string>
  implements MultipleSelectorStateAction<TItem, TId>
{
  private readonly id: TId;

  constructor(id: TId) {
    this.id = id;
  }

  reduce(state: MultipleSelectorState<TItem, TId>): MultipleSelectorState<TItem, TId> {
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
