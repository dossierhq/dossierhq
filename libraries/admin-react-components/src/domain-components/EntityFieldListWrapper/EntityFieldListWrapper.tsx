import React, { useCallback } from 'react';
import type { EntityFieldEditorProps } from '../..';
import { Column } from '../..';

interface Props<Item> extends EntityFieldEditorProps<Item[]> {
  Editor: React.JSXElementConstructor<EntityFieldEditorProps<Item>>;
}

export function EntityFieldListWrapper<Item>({
  id,
  value,
  fieldSpec,
  onChange,
  Editor,
}: Props<Item>): JSX.Element {
  const handleItemChange = useCallback(
    (itemValue: Item | null, index: number) => {
      if (onChange) {
        const newValue = value ? [...value] : [];
        if (itemValue === null || itemValue === undefined) {
          newValue.splice(index, 1);
        } else {
          newValue[index] = itemValue;
        }
        onChange(newValue.length > 0 ? newValue : null);
      }
    },
    [value, onChange]
  );

  const itemsAndNew = value ? [...value, null] : [null];

  return (
    <Column gap={1}>
      {itemsAndNew.map((x, index) => {
        return (
          <Editor
            key={index}
            id={index === 0 ? id : `${id}-${index}`}
            value={x}
            fieldSpec={fieldSpec}
            onChange={(newItemValue) => handleItemChange(newItemValue, index)}
          />
        );
      })}
    </Column>
  );
}
