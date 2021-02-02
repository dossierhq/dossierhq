import React from 'react';
import type { FieldSpecification } from '@datadata/core';
import {
  isEntityTypeField,
  isEntityTypeListField,
  isStringField,
  isStringListField,
} from '@datadata/core';
import { EntityFieldListWrapper, EntityPicker, FormField, InputText } from '..';

interface Props {
  idPrefix: string;
  fieldSpec: FieldSpecification;
  value: unknown;
  onValueChanged: (value: unknown) => void;
}

export interface EntityFieldEditorProps<T> {
  id?: string;
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
    editor = <InputText id={id} value={value} onChange={onValueChanged} />;
  } else if (isStringListField(fieldSpec, value)) {
    editor = (
      <EntityFieldListWrapper
        id={id}
        value={value}
        fieldSpec={fieldSpec}
        onChange={onValueChanged}
        Editor={InputText}
      />
    );
  } else if (isEntityTypeField(fieldSpec, value)) {
    editor = <EntityPicker id={id} value={value} fieldSpec={fieldSpec} onChange={onValueChanged} />;
  } else if (isEntityTypeListField(fieldSpec, value)) {
    editor = (
      <EntityFieldListWrapper
        id={id}
        value={value}
        fieldSpec={fieldSpec}
        onChange={onValueChanged}
        Editor={EntityPicker}
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
