import type { FieldSpecification } from '@jonasb/datadata-core';
import { isEntityTypeField, isStringField, isValueTypeField } from '@jonasb/datadata-core';
import React from 'react';
import { EntityTypeFieldEditor } from './EntityTypeFieldEditor';
import { StringFieldEditor } from './StringFieldEditor';
import { ValueTypeFieldEditor } from './ValueTypeFieldEditor';

export interface FieldEditorProps<T> {
  fieldSpec: FieldSpecification;
  value: T | null;
  onChange: (value: T | null) => void;
}

export function FieldEditor({ value, ...props }: FieldEditorProps<unknown>) {
  const { fieldSpec } = props;
  let editor;
  if (isEntityTypeField(fieldSpec, value)) {
    editor = <EntityTypeFieldEditor {...props} value={value} />;
  } else if (isStringField(fieldSpec, value)) {
    editor = <StringFieldEditor {...props} value={value} />;
  } else if (isValueTypeField(fieldSpec, value)) {
    editor = <ValueTypeFieldEditor {...props} value={value} />;
  } else {
    editor = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }
  return editor;
}
