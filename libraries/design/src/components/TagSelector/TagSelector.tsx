import type { Dispatch } from 'react';
import type {
  MultipleSelectorItem,
  MultipleSelectorState,
  MultipleSelectorStateAction,
} from '../DropdownSelector/MultipleSelectorReducer.js';
import { MultipleSelectorStateActions } from '../DropdownSelector/MultipleSelectorReducer.js';
import type { TagProps } from '../Tag/Tag.js';
import { Tag } from '../Tag/Tag.js';

export interface TagSelectorProps<TItem extends MultipleSelectorItem> {
  clearLabel: string;
  itemTag: (item: TItem) => { tag: string; color?: TagProps['color'] };
  state: MultipleSelectorState<TItem>;
  dispatch: Dispatch<MultipleSelectorStateAction<TItem>>;
}

export function TagSelector<TItem extends MultipleSelectorItem>({
  clearLabel,
  itemTag,
  state,
  dispatch,
}: TagSelectorProps<TItem>): JSX.Element | null {
  const { items, selectedIds } = state;
  if (selectedIds.length === 0) {
    return null;
  }

  const selectedItems = items.filter(({ id }) => selectedIds.includes(id));
  return (
    <Tag.Group>
      {selectedItems.map((item) => {
        const { tag, color } = itemTag(item);
        return (
          <Tag key={item.id} color={color}>
            {tag}
            <Tag.Remove
              onClick={() => dispatch(new MultipleSelectorStateActions.ToggleItem(item.id))}
            />
          </Tag>
        );
      })}
      <Tag.Clear onClick={() => dispatch(new MultipleSelectorStateActions.ClearSelection())}>
        {clearLabel}
      </Tag.Clear>
    </Tag.Group>
  );
}
