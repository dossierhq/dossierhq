import React from 'react';
import type { FieldSpecification } from '@datadata/core';
import { isStringField } from '@datadata/core';
import { FormField, InputText } from '..';

interface Props {
  fieldSpec: FieldSpecification;
  value: unknown;
  onValueChanged: (value: unknown) => void;
}

export function EntityFieldEditor({ fieldSpec, value, onValueChanged }: Props): JSX.Element {
  let editor;
  if (isStringField(fieldSpec, value)) {
    editor = <InputText value={value} onChange={onValueChanged} />;
  } else {
    return <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }
  return <FormField label={fieldSpec.name}>{editor}</FormField>;
}
