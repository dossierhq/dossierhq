import { Field, Radio } from '@jonasb/datadata-design';
import type { SchemaIndexDraft } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

interface Props {
  indexDraft: SchemaIndexDraft;
}

export function SchemaIndexEditor({ indexDraft }: Props) {
  // const canChangeIndex = indexDraft.status === 'new';

  return (
    <Field>
      <Field.Label>Index type</Field.Label>
      <Field.Control>
        <Radio name="type" checked>
          {indexDraft.type}
        </Radio>
      </Field.Control>
    </Field>
  );
}
