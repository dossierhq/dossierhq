import type { ChangeEventHandler, KeyboardEventHandler } from 'react';
import React from 'react';
import type { Color } from '../../config/Colors.js';
import { toColorClassName } from '../../config/Colors.js';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { IconName } from '../index.js';
import { Icon } from '../index.js';

export interface InputProps {
  color?: Color;
  iconLeft?: IconName;
  placeholder?: string;
  readOnly?: boolean;
  type?: 'text' | 'number';
  min?: number;
  max?: number;
  step?: number;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
}

export function Input({
  color,
  iconLeft,
  placeholder,
  type,
  readOnly,
  min,
  max,
  step,
  value,
  onChange,
  onKeyDown,
}: InputProps): JSX.Element {
  const className = toClassName('control', iconLeft && 'has-icons-left');
  return (
    <div className={className}>
      <input
        className={toClassName('input', toColorClassName(color))}
        type={type ?? 'text'}
        {...{ min, max, step, placeholder, readOnly, value, onChange, onKeyDown }}
      />
      {iconLeft ? <Icon className="is-left" icon={iconLeft} /> : null}
    </div>
  );
}
