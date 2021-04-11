import React from 'react';
import type { FieldSpecification, Schema } from '@datadata/core';
import {
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
} from '@datadata/core';
import {
  EntityFieldListWrapper,
  EntityItemFieldEditor,
  FormField,
  LocationFieldEditor,
  RichTextFieldEditor,
  StringFieldEditor,
  ValueTypeFieldEditor,
} from '../..';

interface Props {
  idPrefix: string;
  schema: Schema;
  fieldSpec: FieldSpecification;
  value: unknown;
  onValueChanged: (value: unknown) => void;
}

export interface EntityFieldEditorProps<T> {
  id: string;
  value: T | null;
  fieldSpec: FieldSpecification;
  onChange?: (value: T | null) => void;
}

export function EntityFieldEditor({
  idPrefix,
  fieldSpec,
  value,
  onValueChanged,
}: Props): JSX.Element {
  const id = `${idPrefix}-${fieldSpec.name}`;

  let editor;
  if (isStringField(fieldSpec, value)) {
    editor = (
      <StringFieldEditor id={id} value={value} fieldSpec={fieldSpec} onChange={onValueChanged} />
    );
  } else if (isStringListField(fieldSpec, value)) {
    editor = (
      <EntityFieldListWrapper
        id={id}
        value={value}
        fieldSpec={fieldSpec}
        onChange={onValueChanged}
        Editor={StringFieldEditor}
      />
    );
  } else if (isRichTextField(fieldSpec, value)) {
    editor = (
      <RichTextFieldEditor id={id} value={value} fieldSpec={fieldSpec} onChange={onValueChanged} />
    );
  } else if (isRichTextListField(fieldSpec, value)) {
    editor = (
      <EntityFieldListWrapper
        id={id}
        value={value}
        fieldSpec={fieldSpec}
        onChange={onValueChanged}
        Editor={RichTextFieldEditor}
      />
    );
  } else if (isLocationField(fieldSpec, value)) {
    editor = (
      <LocationFieldEditor id={id} value={value} fieldSpec={fieldSpec} onChange={onValueChanged} />
    );
  } else if (isLocationListField(fieldSpec, value)) {
    editor = (
      <EntityFieldListWrapper
        id={id}
        value={value}
        fieldSpec={fieldSpec}
        onChange={onValueChanged}
        Editor={LocationFieldEditor}
      />
    );
  } else if (isEntityTypeField(fieldSpec, value)) {
    editor = (
      <EntityItemFieldEditor
        id={id}
        value={value}
        fieldSpec={fieldSpec}
        onChange={onValueChanged}
      />
    );
  } else if (isEntityTypeListField(fieldSpec, value)) {
    editor = (
      <EntityFieldListWrapper
        id={id}
        value={value}
        fieldSpec={fieldSpec}
        onChange={onValueChanged}
        Editor={EntityItemFieldEditor}
      />
    );
  } else if (isValueTypeField(fieldSpec, value)) {
    editor = (
      <ValueTypeFieldEditor id={id} value={value} fieldSpec={fieldSpec} onChange={onValueChanged} />
    );
  } else if (isValueTypeListField(fieldSpec, value)) {
    editor = (
      <EntityFieldListWrapper
        id={id}
        value={value}
        fieldSpec={fieldSpec}
        onChange={onValueChanged}
        Editor={ValueTypeFieldEditor}
      />
    );
  } else {
    editor = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }

  return (
    <FormField htmlFor={id} label={fieldSpec.name}>
      {editor}
    </FormField>
  );
}
