import type {
  FunctionComponent,
  OptionHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import React from 'react';

export interface SelectDisplayProps {
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
  value,
  onChange,
  children,
}: SelectDisplayProps) => {
  return (
    <div className="select">
      <select value={value} onChange={onChange}>
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
