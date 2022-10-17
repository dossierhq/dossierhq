import type { AdminFieldSpecification, ValidationError } from '@jonasb/datadata-core';
import {
  isBooleanField,
  isBooleanListField,
  isEntityTypeField,
  isEntityTypeListField,
  isLocationField,
  isLocationListField,
  isRichTextField,
  isRichTextListField,
  isStringField,
  isStringListField,
  isValueTypeField,
  isValueTypeListField,
} from '@jonasb/datadata-core';
import { useContext } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext.js';
import { BooleanFieldEditor } from './BooleanFieldEditor.js';
import { EntityTypeFieldEditor } from './EntityTypeFieldEditor.js';
import { FieldListWrapper } from './FieldListWrapper.js';
import { LocationFieldEditor } from './LocationFieldEditor.js';
import { RichTextFieldEditor } from './RichTextFieldEditor.js';
import { StringFieldEditor } from './StringFieldEditor.js';
import { ValueTypeFieldEditor } from './ValueTypeFieldEditor.js';

export interface FieldEditorProps<T> {
  fieldSpec: AdminFieldSpecification;
  value: T | null;
  onChange: (value: T | null) => void;
  validationErrors: ValidationError[];
}

export function FieldEditor(props: FieldEditorProps<unknown>) {
  const { fieldSpec, value } = props;
  const { adapter } = useContext(AdminDataDataContext);

  const overriddenEditor = adapter.renderAdminFieldEditor(props);
  if (overriddenEditor) {
    return overriddenEditor;
  }

  let editor: JSX.Element;
  if (isBooleanField(fieldSpec, value)) {
    editor = <BooleanFieldEditor {...props} value={value} />;
  } else if (isBooleanListField(fieldSpec, value)) {
    editor = <FieldListWrapper {...props} value={value} Editor={BooleanFieldEditor} />;
  } else if (isEntityTypeField(fieldSpec, value)) {
    editor = <EntityTypeFieldEditor {...props} value={value} />;
  } else if (isEntityTypeListField(fieldSpec, value)) {
    editor = <FieldListWrapper {...props} value={value} Editor={EntityTypeFieldEditor} />;
  } else if (isLocationField(fieldSpec, value)) {
    editor = <LocationFieldEditor {...props} value={value} />;
  } else if (isLocationListField(fieldSpec, value)) {
    editor = <FieldListWrapper {...props} value={value} Editor={LocationFieldEditor} />;
  } else if (isRichTextField(fieldSpec, value)) {
    editor = <RichTextFieldEditor {...props} value={value} />;
  } else if (isRichTextListField(fieldSpec, value)) {
    editor = <FieldListWrapper {...props} value={value} Editor={RichTextFieldEditor} />;
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
