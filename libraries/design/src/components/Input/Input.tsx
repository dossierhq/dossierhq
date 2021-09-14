import React from 'react';
import type { IconName } from '..';
import { Icon } from '..';
import { toClassName } from '../../utils/ClassNameUtils';

export interface InputProps {
  iconLeft?: IconName;
  placeholder?: string;
}

export function Input({ iconLeft, placeholder }: InputProps): JSX.Element {
  const className = toClassName('control', iconLeft && 'has-icons-left');
  return (
    <p className={className}>
      <input className="input" type="text" placeholder={placeholder} />
      {iconLeft ? <Icon className="is-left" icon={iconLeft} /> : null}
    </p>
  );
}
