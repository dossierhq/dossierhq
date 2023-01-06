import { Radio } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import type {
  SchemaEditorStateAction,
  SchemaFieldSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

interface Props {
  fieldSelector: SchemaFieldSelector;
  integer: boolean;
  disabled: boolean;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function NumberVariantSelector({
  disabled,
  fieldSelector,
  integer,
  dispatchSchemaEditorState,
}: Props) {
  return (
    <>
      <Radio
        name="variant"
        value="entity"
        checked={!integer}
        disabled={disabled}
        onChange={() => {
          dispatchSchemaEditorState(
            new SchemaEditorActions.ChangeFieldInteger(fieldSelector, false)
          );
        }}
      >
        Float
      </Radio>
      <Radio
        name="kind"
        value="value"
        checked={integer}
        disabled={disabled}
        onChange={() => {
          dispatchSchemaEditorState(
            new SchemaEditorActions.ChangeFieldInteger(fieldSelector, true)
          );
        }}
      >
        Integer
      </Radio>
    </>
  );
}
