import { useId } from 'react';
import type { FieldEditorState } from '../reducers/EntityEditorReducer.js';
import { FieldEditor } from './FieldEditor.js';
import { Badge } from './ui/badge.js';
import { Label } from './ui/label.js';

interface Props {
  field: FieldEditorState;
  onValueChange: (value: unknown) => void;
}

export function EntityFieldEditor({ field, onValueChange }: Props) {
  const id = useId();
  //TODO no need to show admin only and required tags when the "type"/context is admin only
  return (
    <>
      <div className="mb-1 flex items-baseline gap-2 py-2">
        <Label className="w-0 grow" htmlFor={id}>
          {field.fieldSpec.name}
        </Label>
        {field.fieldSpec.adminOnly && <Badge variant="outline">Admin only</Badge>}
        {!field.fieldSpec.adminOnly && field.fieldSpec.required && (
          <Badge variant="outline">Required</Badge>
        )}
        {field.status === 'changed' && (
          <span
            className="inline-block h-3 w-3 self-center rounded-full bg-foreground"
            title="Changed"
          />
        )}
      </div>
      <div className="flex max-h-[80vh] flex-col">
        <FieldEditor
          id={id}
          fieldSpec={field.fieldSpec}
          adminOnly={field.adminOnly}
          value={field.value}
          onChange={onValueChange}
          validationIssues={field.validationIssues}
        />
      </div>
    </>
  );
}
