import React, { useCallback } from 'react';
import { Column } from '../../generic-components/Column/Column';
import type { LegacyEntityFieldEditorProps } from '../LegacyEntityFieldEditor/LegacyEntityFieldEditor';

interface Props<Item> extends LegacyEntityFieldEditorProps<Item[]> {
  Editor: React.JSXElementConstructor<LegacyEntityFieldEditorProps<Item>>;
}

export function LegacyEntityFieldListWrapper<Item>({
  id,
  value,
  fieldSpec,
  draftState,
  valuePath,
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
      {itemsAndNew.map((it, index) => {
        return (
          <Editor
            key={index}
            id={index === 0 ? id : `${id}-${index}`}
            value={it}
            fieldSpec={fieldSpec}
            draftState={draftState}
            valuePath={[...valuePath, index]}
            onChange={(newItemValue) => handleItemChange(newItemValue, index)}
          />
        );
      })}
    </Column>
  );
}
