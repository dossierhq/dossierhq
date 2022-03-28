import type { FunctionComponent } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils';

export interface FieldProps {
  horizontal?: boolean;
  children: React.ReactNode;
}

export interface FieldLabelProps {
  size?: 'small' | 'medium' | 'large';
  children: string;
}

export interface FieldControlProps {
  children: React.ReactNode;
}

export interface FieldLabelColumnProps {
  children?: React.ReactNode;
}

export interface FieldBodyColumnProps {
  children: React.ReactNode;
}

interface FieldComponent extends FunctionComponent<FieldProps> {
  Label: FunctionComponent<FieldLabelProps>;
  Control: FunctionComponent<FieldControlProps>;
  LabelColumn: FunctionComponent<FieldLabelColumnProps>;
  BodyColumn: FunctionComponent<FieldBodyColumnProps>;
}

const LABEL_SIZE_CLASSNAMES = {
  small: 'is-small',
  medium: 'is-medium',
  large: 'is-large',
};

export const Field: FieldComponent = ({ horizontal, children }: FieldProps) => {
  return <div className={toClassName('field', horizontal && 'is-horizontal')}>{children}</div>;
};
Field.displayName = 'Field';

Field.Label = ({ size, children }: FieldLabelProps) => {
  return (
    <label className={toClassName('label', size && LABEL_SIZE_CLASSNAMES[size])}>{children}</label>
  );
};
Field.Label.displayName = 'Field.Label';

Field.Control = ({ children }: FieldControlProps) => {
  return <div className="control">{children}</div>;
};
Field.Control.displayName = 'Field.Control';

Field.LabelColumn = ({ children }: FieldLabelColumnProps) => {
  return <div className="field-label is-normal">{children}</div>;
};
Field.LabelColumn.displayName = 'Field.LabelColumn';

Field.BodyColumn = ({ children }: FieldBodyColumnProps) => {
  return <div className="field-body">{children}</div>;
};
Field.BodyColumn.displayName = 'Field.BodyColumn';
