import type { Dispatch } from 'react';
import { useCallback } from 'react';
import { Dropdown } from '../Dropdown/Dropdown.js';
import type {
  MultipleSelectorItem,
  MultipleSelectorState,
  MultipleSelectorStateAction,
} from '../DropdownSelector/MultipleSelectorReducer.js';
import { MultipleSelectorStateActions } from '../DropdownSelector/MultipleSelectorReducer.js';
import type { TagProps } from '../Tag/Tag.js';
import { Tag } from '../Tag/Tag.js';
import { TagInput } from '../TagInput/TagInput.js';

export interface TagInputSelectorProps<TItem extends MultipleSelectorItem> {
  clearLabel: string;
  itemTag: (item: TItem) => { tag: string; color?: TagProps['color'] };
  state: MultipleSelectorState<TItem>;
  dispatch: Dispatch<MultipleSelectorStateAction<TItem>>;
}

export function TagInputSelector<TItem extends MultipleSelectorItem>({
  clearLabel,
  itemTag,
  state,
  dispatch,
}: TagInputSelectorProps<TItem>): JSX.Element | null {
  const { items, selectedIds, containsRemovableSelection } = state;

  const selectedItems = items.filter(({ id }) => selectedIds.includes(id));

  const handleItemClick = useCallback(
    ({ id }: TItem) => dispatch(new MultipleSelectorStateActions.ToggleItem(id)),
    [dispatch]
  );

  return (
    <Dropdown<HTMLDivElement, TItem>
      items={items}
      activeItemIds={selectedIds}
      isContentItem={(item) => item.removable === false}
      renderItem={(item) => {
        const { tag, color } = itemTag(item);
        return (
          <Tag key={item.id} color={color}>
            {tag}
          </Tag>
        );
      }}
      renderTrigger={(ref, onOpenDropDown) => {
        return (
          <TagInput ref={ref} onClick={onOpenDropDown}>
            {selectedItems.map((item) => {
              const { tag, color } = itemTag(item);
              return (
                <Tag key={item.id} color={color}>
                  {tag}
                  {item.removable !== false ? (
                    <Tag.Remove
                      onClick={() => dispatch(new MultipleSelectorStateActions.ToggleItem(item.id))}
                    />
                  ) : null}
                </Tag>
              );
            })}
            {containsRemovableSelection ? (
              <Tag.Clear
                onClick={() => dispatch(new MultipleSelectorStateActions.ClearSelection())}
              >
                {clearLabel}
              </Tag.Clear>
            ) : null}
          </TagInput>
        );
      }}
      onItemClick={handleItemClick}
    />
  );
}
