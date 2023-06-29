import {
  groupValidationIssuesByTopLevelPath,
  type AdminFieldSpecification,
  type FieldSpecification,
  type PublishValidationIssue,
  type SaveValidationIssue,
} from '@dossierhq/core';
import {
  Column,
  GridList,
  GridListDragHandle,
  GridListItem,
  Text,
  useDragAndDrop,
} from '@dossierhq/design';
import React, { useCallback, useMemo } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';

interface Props<TFieldSpec extends FieldSpecification, TItem>
  extends FieldEditorProps<TFieldSpec, (TItem | null)[]> {
  AddButton: React.JSXElementConstructor<{
    fieldSpec: AdminFieldSpecification<TFieldSpec>;
    value: (TItem | null)[] | null;
    onChange: (value: (TItem | null)[] | null) => void;
  }>;
  Editor: React.JSXElementConstructor<FieldEditorProps<TFieldSpec, TItem>>;
}

const noErrors: (PublishValidationIssue | SaveValidationIssue)[] = [];

export function FieldListWrapper<TFieldSpec extends FieldSpecification, TItem>({
  value,
  fieldSpec,
  adminOnly,
  validationIssues,
  onChange,
  AddButton,
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

  const { dragAndDropHooks: fieldsDragAndDropHooks } = useDragAndDrop({
    getItems: (keys) =>
      [...keys].map((key) => ({ 'application/json': JSON.stringify(value?.[key as number]) })),
    onReorder: (event) => {
      if (!value || event.target.dropPosition === 'on') {
        return;
      }
      const moveIndex = [...event.keys][0] as number;
      let targetIndex = event.target.key as number;
      if (moveIndex === targetIndex) {
        return;
      }

      const newValue = [...value];
      const [itemToMove] = newValue.splice(moveIndex, 1);
      if (targetIndex > moveIndex) {
        targetIndex--;
      }

      if (event.target.dropPosition === 'after') {
        newValue.splice(targetIndex + 1, 0, itemToMove);
      } else {
        newValue.splice(targetIndex, 0, itemToMove);
      }
      onChange(newValue);
    },
  });

  return (
    <Column overflowY="auto">
      {value && value.length > 0 ? (
        <GridList aria-label={`List of values`} dragAndDropHooks={fieldsDragAndDropHooks}>
          {value.map((it, index) => {
            return (
              <GridListItem
                key={index}
                id={index}
                className="nested-value-item-indentation"
                marginVertical={1}
                textValue={`Value ${index + 1}`}
              >
                <GridListDragHandle />
                <Editor
                  value={it}
                  fieldSpec={fieldSpec}
                  adminOnly={adminOnly}
                  validationIssues={indexValidationIssues.get(index) ?? noErrors}
                  onChange={(newItemValue) => handleItemChange(newItemValue, index)}
                />
              </GridListItem>
            );
          })}
        </GridList>
      ) : null}

      <AddButton fieldSpec={fieldSpec} value={value} onChange={onChange} />
      {rootValidationIssues.map((error, index) => (
        <Text key={index} textStyle="body2" color="danger" marginTop={1}>
          {error.message}
        </Text>
      ))}
    </Column>
  );
}
