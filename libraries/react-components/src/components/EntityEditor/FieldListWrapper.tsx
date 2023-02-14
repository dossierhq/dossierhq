import type {
  FieldSpecification,
  PublishValidationIssue,
  SaveValidationIssue,
} from '@dossierhq/core';
import { groupValidationIssuesByTopLevelPath } from '@dossierhq/core';
import { Column, Text } from '@dossierhq/design';
import React, { useCallback, useMemo } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';

interface Props<TFieldSpec extends FieldSpecification, TItem>
  extends FieldEditorProps<TFieldSpec, TItem[]> {
  Editor: React.JSXElementConstructor<FieldEditorProps<TFieldSpec, TItem>>;
}

const noErrors: (PublishValidationIssue | SaveValidationIssue)[] = [];

export function FieldListWrapper<TFieldSpec extends FieldSpecification, TItem>({
  value,
  fieldSpec,
  adminOnly,
  validationIssues,
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

  const { root: rootValidationIssues, children: indexValidationIssues } = useMemo(
    () => groupValidationIssuesByTopLevelPath(validationIssues),
    [validationIssues]
  );

  const itemsAndNew = value ? [...value, null] : [null];

  return (
    <Column gap={2} overflowY="auto">
      {itemsAndNew.map((it, index) => {
        return (
          <div key={index} className="nested-value-item-indentation">
            <Editor
              value={it}
              fieldSpec={fieldSpec}
              adminOnly={adminOnly}
              validationIssues={indexValidationIssues.get(index) ?? noErrors}
              onChange={(newItemValue) => handleItemChange(newItemValue, index)}
            />
          </div>
        );
      })}
      {rootValidationIssues.map((error, index) => (
        <Text key={index} textStyle="body2" color="danger">
          {error.message}
        </Text>
      ))}
    </Column>
  );
}
