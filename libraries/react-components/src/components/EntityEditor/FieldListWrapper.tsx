import type {
  FieldSpecification,
  PublishValidationError,
  SaveValidationError,
} from '@dossierhq/core';
import { Column } from '@dossierhq/design';
import React, { useCallback, useMemo } from 'react';
import { groupValidationErrorsByTopLevelPath } from '../../utils/ValidationUtils.js';
import type { FieldEditorProps } from './FieldEditor.js';

interface Props<TFieldSpec extends FieldSpecification, TItem>
  extends FieldEditorProps<TFieldSpec, TItem[]> {
  Editor: React.JSXElementConstructor<FieldEditorProps<TFieldSpec, TItem>>;
}

const noErrors: (PublishValidationError | SaveValidationError)[] = [];

export function FieldListWrapper<TFieldSpec extends FieldSpecification, TItem>({
  value,
  fieldSpec,
  validationErrors,
  onChange,
  Editor,
}: Props<TFieldSpec, TItem>): JSX.Element {
  const handleItemChange = useCallback(
    (itemValue: TItem | null, index: number) => {
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
    <Column gap={3} overflowY="auto">
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
