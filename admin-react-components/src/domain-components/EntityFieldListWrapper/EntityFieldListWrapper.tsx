import React, { useCallback } from 'react';
import type { EntityFieldEditorProps } from '../..';

interface Props extends EntityFieldEditorProps<unknown[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Editor: React.JSXElementConstructor<EntityFieldEditorProps<any>>;
}

export function EntityFieldListWrapper({
  id,
  value,
  schema,
  fieldSpec,
  onChange,
  Editor,
}: Props): JSX.Element {
  const handleItemChange = useCallback(
    (itemValue: unknown, index: number) => {
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
    <div>
      {itemsAndNew.map((x, index) => {
        return (
          <Editor
            key={index}
            id={index === 0 ? id : `${id}-${index}`}
            value={x}
            schema={schema}
            fieldSpec={fieldSpec}
            onChange={(newItemValue) => handleItemChange(newItemValue, index)}
          />
        );
      })}
    </div>
  );
}
