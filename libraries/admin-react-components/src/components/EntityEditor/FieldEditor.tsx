import type { FieldSpecification } from '@jonasb/datadata-core';
import { isStringField } from '@jonasb/datadata-core';
import React from 'react';
import { StringFieldEditor } from './StringFieldEditor';

export interface FieldEditorProps<T> {
  fieldSpec: FieldSpecification;
  value: T | null;
  onChange: (value: T | null) => void;
}

export function FieldEditor({ value, ...props }: FieldEditorProps<unknown>) {
  const { fieldSpec } = props;
  let editor;
  if (isStringField(fieldSpec, value)) {
    editor = <StringFieldEditor {...props} value={value} />;
  } else {
    editor = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }
  return editor;
}
