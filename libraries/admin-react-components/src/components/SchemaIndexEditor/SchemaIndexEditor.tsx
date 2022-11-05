import { Field, Input } from '@jonasb/datadata-design';
import type { SchemaIndexDraft } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

interface Props {
  indexDraft: SchemaIndexDraft;
}

export function SchemaIndexEditor({ indexDraft }: Props) {
  const canChangeIndex = indexDraft.status === 'new';

  return (
    <Field>
      <Field.Label>Index</Field.Label>
      <Field.Control>
        <Input readOnly={!canChangeIndex} value={indexDraft.type} />
      </Field.Control>
    </Field>
  );
}
