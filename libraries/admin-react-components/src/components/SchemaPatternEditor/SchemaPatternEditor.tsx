import { Field, Input } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaPatternDraft,
  SchemaPatternSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

interface Props {
  selector: SchemaPatternSelector;
  patternDraft: SchemaPatternDraft;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function SchemaPatternEditor({
  selector: _1,
  patternDraft,
  schemaEditorState: _2,
  dispatchSchemaEditorState: _3,
}: Props) {
  const canChangePattern = patternDraft.status === 'new'; //TODO too restrictive
  return (
    <Field>
      <Field.Label>Pattern</Field.Label>
      <Field.Control>
        <Input readOnly={!canChangePattern} value={patternDraft.pattern} />
      </Field.Control>
    </Field>
  );
}
