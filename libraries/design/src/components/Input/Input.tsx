import React from 'react';
import type { IconName } from '../index.js';
import { Icon } from '../index.js';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface InputProps {
  iconLeft?: IconName;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export function Input({ iconLeft, placeholder, value, onChange }: InputProps): JSX.Element {
  const className = toClassName('control', iconLeft && 'has-icons-left');
  return (
    <p className={className}>
      <input
        className="input"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {iconLeft ? <Icon className="is-left" icon={iconLeft} /> : null}
    </p>
  );
}
