import type { FunctionComponent } from 'react';
import { toColorClassName, type Color } from '../../config/Colors.js';
import { toClassName } from '../../utils/ClassNameUtils.js';

interface FieldProps {
  grouped?: boolean;
  horizontal?: boolean;
  children: React.ReactNode;
}

interface FieldLabelProps {
  size?: 'small' | 'medium' | 'large';
  children: string;
}

interface FieldControlProps {
  children: React.ReactNode;
}

interface FieldHelpProps {
  color?: Color;
  children: React.ReactNode;
}

interface FieldLabelColumnProps {
  children?: React.ReactNode;
}

interface FieldBodyColumnProps {
  children: React.ReactNode;
}

/** @public */
export interface FieldComponent extends FunctionComponent<FieldProps> {
  Label: FunctionComponent<FieldLabelProps>;
  Control: FunctionComponent<FieldControlProps>;
  Help: FunctionComponent<FieldHelpProps>;
  LabelColumn: FunctionComponent<FieldLabelColumnProps>;
  BodyColumn: FunctionComponent<FieldBodyColumnProps>;
}

const LABEL_SIZE_CLASSNAMES = {
  small: 'is-small',
  medium: 'is-medium',
  large: 'is-large',
};

export const Field: FieldComponent = ({ grouped, horizontal, children }: FieldProps) => {
  return (
    <div className={toClassName('field', grouped && 'is-grouped', horizontal && 'is-horizontal')}>
      {children}
    </div>
  );
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

Field.Help = ({ color, children }: FieldHelpProps) => {
  return <p className={toClassName('help', toColorClassName(color))}>{children}</p>;
};
Field.Help.displayName = 'Field.Help';

Field.LabelColumn = ({ children }: FieldLabelColumnProps) => {
  return <div className="field-label is-normal">{children}</div>;
};
Field.LabelColumn.displayName = 'Field.LabelColumn';

Field.BodyColumn = ({ children }: FieldBodyColumnProps) => {
  return <div className="field-body">{children}</div>;
};
Field.BodyColumn.displayName = 'Field.BodyColumn';
