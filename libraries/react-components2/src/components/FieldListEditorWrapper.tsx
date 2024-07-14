import {
  groupValidationIssuesByTopLevelPath,
  type FieldSpecification,
  type PublishValidationIssue,
  type SaveValidationIssue,
} from '@dossierhq/core';
import { useCallback, useMemo, type JSXElementConstructor } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';
import { ValidationIssuesDisplay } from './ValidationIssuesDisplay.js';

interface Props<TFieldSpec extends FieldSpecification, TItem>
  extends FieldEditorProps<TFieldSpec, (TItem | null)[]> {
  AddButton: JSXElementConstructor<{
    fieldSpec: TFieldSpec;
    onAddItem: (value: TItem | null) => void;
  }>;
  Editor: JSXElementConstructor<FieldEditorProps<TFieldSpec, TItem>>;
}

const noErrors: (PublishValidationIssue | SaveValidationIssue)[] = [];

export function FieldListEditorWrapper<TFieldSpec extends FieldSpecification, TItem>({
  id,
  value,
  fieldSpec,
  adminOnly,
  validationIssues,
  onChange,
  AddButton,
  Editor,
}: Props<TFieldSpec, TItem>): JSX.Element {
  const handleAddItem = useCallback(
    (itemValue: TItem | null) => {
      if (onChange) {
        onChange(value ? [...value, itemValue] : [itemValue]);
      }
    },
    [value, onChange],
  );
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
    [value, onChange],
  );

  const { root: rootValidationIssues, children: indexValidationIssues } = useMemo(
    () => groupValidationIssuesByTopLevelPath(validationIssues),
    [validationIssues],
  );

  //TODO drag and drop
  // const { dragAndDropHooks: fieldsDragAndDropHooks } = useDragAndDrop({
  //   getItems: (keys) =>
  //     [...keys].map((key) => ({ 'application/json': JSON.stringify(value?.[key as number]) })),
  //   onReorder: (event) => {
  //     if (!value || event.target.dropPosition === 'on') {
  //       return;
  //     }
  //     const moveIndex = [...event.keys][0] as number;
  //     let targetIndex = event.target.key as number;
  //     if (moveIndex === targetIndex) {
  //       return;
  //     }

  //     const newValue = [...value];
  //     const [itemToMove] = newValue.splice(moveIndex, 1);
  //     if (targetIndex > moveIndex) {
  //       targetIndex--;
  //     }

  //     if (event.target.dropPosition === 'after') {
  //       newValue.splice(targetIndex + 1, 0, itemToMove);
  //     } else {
  //       newValue.splice(targetIndex, 0, itemToMove);
  //     }
  //     onChange(newValue);
  //   },
  // });

  return (
    <div className="flex flex-col gap-1 overflow-y-auto">
      {value && value.length > 0 ? (
        <>
          {/*<GridList aria-label={`List of values`} dragAndDropHooks={fieldsDragAndDropHooks}>*/}
          {value.map((it, index) => {
            //     return (
            //       <GridListItem
            //         key={index}
            //         id={index}
            //         className="nested-value-item-indentation"
            //         marginVertical={1}
            //         textValue={`Value ${index + 1}`}
            //       >
            return (
              <Editor
                key={index}
                id={index === 0 ? id : undefined}
                value={it}
                fieldSpec={fieldSpec}
                adminOnly={adminOnly}
                validationIssues={indexValidationIssues.get(index) ?? noErrors}
                // dragHandle={<GridListDragHandle />}
                onChange={(newItemValue) => handleItemChange(newItemValue, index)}
              />
            );
            // </GridListItem>
          })}
        </>
      ) : // </GridList>
      null}
      <AddButton fieldSpec={fieldSpec} onAddItem={handleAddItem} />
      <ValidationIssuesDisplay validationIssues={rootValidationIssues} />
    </div>
  );
}
