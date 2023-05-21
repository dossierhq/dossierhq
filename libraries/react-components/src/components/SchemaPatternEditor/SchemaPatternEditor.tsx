import { Field, Input } from '@dossierhq/design';
import type { ChangeEvent, Dispatch } from 'react';
import { useCallback } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaPatternDraft,
  SchemaPatternSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

interface Props {
  selector: SchemaPatternSelector;
  patternDraft: SchemaPatternDraft;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function SchemaPatternEditor({
  selector,
  patternDraft,
  schemaEditorState: _2,
  dispatchSchemaEditorState,
}: Props) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      dispatchSchemaEditorState(
        new SchemaEditorActions.ChangePatternPattern(selector, event.target.value)
      );
    },
    [dispatchSchemaEditorState, selector]
  );

  return (
    <Field>
      <Field.Label>Pattern</Field.Label>
      <Field.Control>
        <Input value={patternDraft.pattern} textStyle="code1" onChange={handleChange} />
      </Field.Control>
    </Field>
  );
}
