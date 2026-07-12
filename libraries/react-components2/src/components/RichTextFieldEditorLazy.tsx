import type { RichText, RichTextFieldSpecification } from '@dossierhq/core';
import { lazy, Suspense, useMemo } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';
import { Button } from './ui/button.js';
import { ValidationIssuesDisplay } from './ValidationIssuesDisplay.js';

// Keep Lexical out of the synchronous bundle by loading the editor lazily
const RichTextFieldEditorInner = lazy(() =>
  import('./richtext/RichTextFieldEditor.js').then((it) => ({ default: it.RichTextFieldEditor })),
);

type Props = FieldEditorProps<RichTextFieldSpecification, RichText>;

export function RichTextFieldEditor({
  id,
  fieldSpec,
  adminOnly,
  value,
  validationIssues,
  dragHandle,
  onChange,
}: Props) {
  //TODO validation issues in components in the rich text are shown both here and in the component editor
  //TODO would be good to show the validation issues in context in the rich text editor
  const uniqueValidationIssues = useMemo(() => {
    const seenMessages = new Set<string>();
    return validationIssues.filter((issue) => {
      if (seenMessages.has(issue.message)) {
        return false;
      }
      seenMessages.add(issue.message);
      return true;
    });
  }, [validationIssues]);

  return (
    <>
      {dragHandle}
      <Suspense>
        <RichTextFieldEditorInner
          id={id}
          fieldSpec={fieldSpec}
          adminOnly={adminOnly}
          value={value}
          onChange={onChange}
        />
      </Suspense>
      <ValidationIssuesDisplay validationIssues={uniqueValidationIssues} />
    </>
  );
}

export function AddRichTextListItemButton({
  onAddItem,
}: {
  fieldSpec: RichTextFieldSpecification;
  onAddItem: (value: RichText | null) => void;
}) {
  return (
    <Button className="self-start" onClick={() => onAddItem(null)}>
      Add
    </Button>
  );
}
