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
  return (
    <FormField
      label={fieldSpec.name}
      render={({ id }) => {
        if (isStringField(fieldSpec, value)) {
          return <InputText id={id} value={value} onChange={onValueChanged} />;
        }
        return <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
      }}
    />
  );
}
