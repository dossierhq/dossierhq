import type { ChangeEventHandler, KeyboardEventHandler } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { IconName } from '../index.js';
import { Icon } from '../index.js';

export interface InputProps {
  iconLeft?: IconName;
  placeholder?: string;
  readOnly?: boolean;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
}

export function Input({
  iconLeft,
  placeholder,
  readOnly,
  value,
  onChange,
  onKeyDown,
}: InputProps): JSX.Element {
  const className = toClassName('control', iconLeft && 'has-icons-left');
  return (
    <p className={className}>
      <input
        className="input"
        type="text"
        placeholder={placeholder}
        readOnly={readOnly}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      {iconLeft ? <Icon className="is-left" icon={iconLeft} /> : null}
    </p>
  );
}
