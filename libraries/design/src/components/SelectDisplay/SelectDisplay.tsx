import type {
  FunctionComponent,
  OptionHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface SelectDisplayProps {
  fullWidth?: boolean;
  value?: SelectHTMLAttributes<HTMLSelectElement>['value'];
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  children: ReactNode;
}

export interface SelectDisplayOptionProps {
  value: OptionHTMLAttributes<HTMLOptionElement>['value'];
  children: ReactNode;
}

interface SelectDisplayComponent extends FunctionComponent<SelectDisplayProps> {
  Option: FunctionComponent<SelectDisplayOptionProps>;
}

export const SelectDisplay: SelectDisplayComponent = ({
  fullWidth,
  value,
  onChange,
  children,
}: SelectDisplayProps) => {
  return (
    <div className={toClassName('select', fullWidth && 'is-width-100')}>
      <select className={fullWidth ? 'is-width-100' : undefined} value={value} onChange={onChange}>
        {children}
      </select>
    </div>
  );
};
SelectDisplay.displayName = 'SelectDisplay';

SelectDisplay.Option = ({ value, children }: SelectDisplayOptionProps) => {
  return <option value={value}>{children}</option>;
};
SelectDisplay.Option.displayName = 'SelectDisplay.Option';
