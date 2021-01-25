import React from 'react';
import type { FieldSpecification } from '@datadata/core';
import { isStringField } from '@datadata/core';
import { FormField, InputText } from '..';

interface Props {
  idPrefix: string;
  fieldSpec: FieldSpecification;
  value: unknown;
  onValueChanged: (value: unknown) => void;
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
  } else if (isEntityTypeField(fieldSpec, value)) {
    editor = <EntityPicker id={id} value={value} onChange={onValueChanged} />;
  } else {
    editor = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }

  return (
    <FormField htmlFor={id} label={fieldSpec.name}>
      {editor}
    </FormField>
  );
}
