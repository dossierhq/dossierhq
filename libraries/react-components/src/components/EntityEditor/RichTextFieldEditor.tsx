import type { RichText, RichTextFieldSpecification } from '@dossierhq/core';
import { Button, Text, toFlexItemClassName } from '@dossierhq/design';
import { useMemo } from 'react';
import { RichTextEditor } from '../RichTextEditor/RichTextEditor.js';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<RichTextFieldSpecification, RichText>;

export function RichTextFieldEditor({
  fieldSpec,
  adminOnly,
  value,
  validationIssues,
  dragHandle,
  onChange,
}: Props) {
  //TODO validation issues in value items in the rich text are shown both here and in the value item editor
  //TODO would be good to show the validation issues in context in the rich text editor
  const uniqueValidationIssues = useMemo(() => {
    const messages = new Set<string>(validationIssues.map((error) => error.message));
    return [...messages];
  }, [validationIssues]);
  return (
    <>
      {dragHandle}
      <RichTextEditor
        fieldSpec={fieldSpec}
        adminOnly={adminOnly}
        value={value}
        onChange={onChange}
      />
      {uniqueValidationIssues.map((message, index) => (
        <Text key={index} textStyle="body2" marginTop={1} color="danger">
          {message}
        </Text>
      ))}
    </>
  );
}

export function AddRichTextListItemButton({
  onAddItem,
}: {
  onAddItem: (value: RichText | null) => void;
}) {
  return (
    <Button
      className={toFlexItemClassName({ alignSelf: 'flex-start' })}
      onClick={() => onAddItem(null)}
    >
      Add
    </Button>
  );
}
