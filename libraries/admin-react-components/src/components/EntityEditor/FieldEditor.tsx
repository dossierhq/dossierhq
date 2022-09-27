import type { AdminFieldSpecification } from '@jonasb/datadata-core';
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
import { BooleanFieldEditor } from './BooleanFieldEditor';
import { EntityTypeFieldEditor } from './EntityTypeFieldEditor';
import { FieldListWrapper } from './FieldListWrapper';
import { LocationFieldEditor } from './LocationFieldEditor';
import { RichTextFieldEditor } from './RichTextFieldEditor';
import { StringFieldEditor } from './StringFieldEditor';
import { ValueTypeFieldEditor } from './ValueTypeFieldEditor';

export interface FieldEditorProps<T> {
  fieldSpec: AdminFieldSpecification;
  value: T | null;
  onChange: (value: T | null) => void;
}

export function FieldEditor(props: FieldEditorProps<unknown>) {
  const { fieldSpec, value } = props;
  const { adapter } = useContext(AdminDataDataContext);

  const overriddenEditor = adapter.renderFieldEditor(props);
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
