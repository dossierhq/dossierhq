import type { FunctionComponent } from 'react';
import React from 'react';
import { Form } from 'react-bulma-components';

export interface FieldProps {
  children: React.ReactNode;
}

export interface FieldLabelProps {
  size?: 'small' | 'medium' | 'large';
  children: string;
}

export interface FieldControlProps {
  children: React.ReactNode;
}

interface FieldComponent extends FunctionComponent<FieldProps> {
  Label: FunctionComponent<FieldLabelProps>;
  Control: FunctionComponent<FieldControlProps>;
}

export const Field: FieldComponent = ({ children }: FieldProps) => {
  return <Form.Field>{children}</Form.Field>;
};
Field.displayName = 'Field';

Field.Label = ({ size, children }: FieldLabelProps) => {
  return <Form.Label size={size}>{children}</Form.Label>;
};
Field.Label.displayName = 'Field.Label';

Field.Control = ({ children }: FieldControlProps) => {
  return <Form.Control>{children}</Form.Control>;
};
Field.Control.displayName = 'Field.Control';
