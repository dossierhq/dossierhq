import React from 'react';
import { joinClassNames } from '../../utils/ClassNameUtils';

export interface CheckboxProps {
  id?: string;
  className?: string;
  onChange?: (value: boolean) => void;
  readOnly?: boolean;
  checked?: boolean;
}

export function Checkbox({
  id,
  className,
  onChange,
  readOnly,
  checked,
}: CheckboxProps): JSX.Element {
  //TODO set indeterminate
  return (
    <input
      id={id}
      className={joinClassNames('dd text-body1 input', className)}
      type="checkbox"
      checked={checked}
      readOnly={readOnly}
      onChange={onChange ? (event) => onChange(event.target.checked) : undefined}
    />
  );
}
