import { Column } from '@jonasb/datadata-design';
import React, { useCallback } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';

interface Props<Item> extends FieldEditorProps<Item[]> {
  Editor: React.JSXElementConstructor<FieldEditorProps<Item>>;
}

export function FieldListWrapper<Item>({
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
    <Column gap={3}>
      {itemsAndNew.map((it, index) => {
        return (
          <div key={index} className="nested-value-item-indentation">
            <Editor
              value={it}
              fieldSpec={fieldSpec}
              onChange={(newItemValue) => handleItemChange(newItemValue, index)}
            />
          </div>
        );
      })}
    </Column>
  );
}
