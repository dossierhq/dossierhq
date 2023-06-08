import { Field, Input } from '@dossierhq/design';
import { type SchemaPatternDraft } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

interface Props {
  patternDraft: SchemaPatternDraft;
  onEditPattern: () => void;
}

export function SchemaPatternEditor({ patternDraft, onEditPattern }: Props) {
  return (
    <Field>
      <Field.Label>Pattern</Field.Label>
      <Field.Control>
        <Input readOnly value={patternDraft.pattern} textStyle="code1" onClick={onEditPattern} />
      </Field.Control>
    </Field>
  );
}
