import type { FieldSpecification } from '@jonasb/datadata-core';
import {
  isEntityTypeField,
  isEntityTypeListField,
  isStringField,
  isStringListField,
  isValueTypeField,
  isValueTypeListField,
} from '@jonasb/datadata-core';
import React from 'react';
import { EntityTypeFieldEditor } from './EntityTypeFieldEditor';
import { FieldListWrapper } from './FieldListWrapper';
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
  } else if (isEntityTypeListField(fieldSpec, value)) {
    editor = <FieldListWrapper {...props} value={value} Editor={EntityTypeFieldEditor} />;
  } else if (isStringField(fieldSpec, value)) {
    editor = <StringFieldEditor {...props} value={value} />;
  } else if (isStringListField(fieldSpec, value)) {
    editor = <FieldListWrapper {...props} value={value} Editor={StringFieldEditor} />;
  } else if (isValueTypeField(fieldSpec, value)) {
    editor = <ValueTypeFieldEditor {...props} value={value} />;
  } else if (isValueTypeListField(fieldSpec, value)) {
    editor = <FieldListWrapper {...props} value={value} Editor={ValueTypeFieldEditor} />;
  } else {
    editor = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }
  return editor;
}
