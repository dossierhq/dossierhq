import { Card2 } from '@jonasb/datadata-design';
import type { FieldEditorState } from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';
import { FieldEditor } from './FieldEditor.js';

interface Props {
  field: FieldEditorState;
  onValueChange: (value: unknown) => void;
}

export function EntityFieldEditor({ field, onValueChange }: Props) {
  return (
    <Card2>
      <Card2.Header noIcons>
        <Card2.HeaderTitle>{field.fieldSpec.name}</Card2.HeaderTitle>
        {field.fieldSpec.adminOnly ? <Card2.HeaderTag>Admin only</Card2.HeaderTag> : null}
        {field.fieldSpec.required ? <Card2.HeaderTag>Required</Card2.HeaderTag> : null}
      </Card2.Header>
      <Card2.Content>
        <FieldEditor
          fieldSpec={field.fieldSpec}
          value={field.value}
          onChange={onValueChange}
          validationErrors={field.validationErrors}
        />
      </Card2.Content>
    </Card2>
  );
}
