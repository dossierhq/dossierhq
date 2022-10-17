import type { ValidationError } from '@jonasb/datadata-core';
import { Column } from '@jonasb/datadata-design';
import React, { useCallback, useMemo } from 'react';
import { groupValidationErrorsByTopLevelPath } from '../../utils/ValidationUtils.js';
import type { FieldEditorProps } from './FieldEditor.js';

interface Props<Item> extends FieldEditorProps<Item[]> {
  Editor: React.JSXElementConstructor<FieldEditorProps<Item>>;
}

const noErrors: ValidationError[] = [];

export function FieldListWrapper<Item>({
  value,
  fieldSpec,
  validationErrors,
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

  const indexValidationErrors = useMemo(
    () => groupValidationErrorsByTopLevelPath(validationErrors),
    [validationErrors]
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
              validationErrors={indexValidationErrors.get(index) ?? noErrors}
              onChange={(newItemValue) => handleItemChange(newItemValue, index)}
            />
          </div>
        );
      })}
    </Column>
  );
}
