import isEqual from 'lodash/isEqual.js';
import type { Reducer } from 'react';
import { assertIsDefined } from '../../utils/AssertUtils.js';

export interface MultipleSelectorItem<TId extends string = string> {
  id: TId;
  removable?: boolean;
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
  containsRemovableSelection: boolean;
}

export interface MultipleSelectorStateAction<TItem extends MultipleSelectorItem> {
  reduce(state: Readonly<MultipleSelectorState<TItem>>): Readonly<MultipleSelectorState<TItem>>;
}

function isItemIdRemovable(items: MultipleSelectorItem[], id: string): boolean {
  const item = items.find((it) => it.id === id);
  assertIsDefined(item);
  return item.removable !== false;
}

function containsRemovableSelection(items: MultipleSelectorItem[], selectedIds: string[]) {
  return selectedIds.some((id) => isItemIdRemovable(items, id));
}

export function initializeMultipleSelectorState<TItem extends MultipleSelectorItem>({
  items,
  selectedIds,
}: MultipleSelectorStateInitializerArgs<TItem>): MultipleSelectorState<TItem> {
  if (!selectedIds) {
    selectedIds = [];
  }
  return {
    items,
    selectedIds,
    containsRemovableSelection: containsRemovableSelection(items, selectedIds),
  };
}

export function reduceMultipleSelectorState<TItem extends MultipleSelectorItem>(
  state: Readonly<MultipleSelectorState<TItem>>,
  action: MultipleSelectorStateAction<TItem>,
): Readonly<MultipleSelectorState<TItem>> {
  let newState = action.reduce(state);
  if (newState !== state) {
    newState = {
      ...newState,
      containsRemovableSelection: containsRemovableSelection(newState.items, newState.selectedIds),
    };
  }
  return newState;
}

// Actions

class ClearSelectionAction<TItem extends MultipleSelectorItem>
  implements MultipleSelectorStateAction<TItem>
{
  reduce(state: Readonly<MultipleSelectorState<TItem>>): Readonly<MultipleSelectorState<TItem>> {
    const selectedIds = state.selectedIds.filter((id) => !isItemIdRemovable(state.items, id));
    if (selectedIds.length === state.selectedIds.length) {
      return state;
    }
    return { ...state, selectedIds };
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
