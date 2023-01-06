import type { ChangeEventHandler, KeyboardEventHandler } from 'react';
import type { Color } from '../../config/Colors.js';
import { toColorClassName } from '../../config/Colors.js';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { TextStyle } from '../../utils/TextStylePropsUtils.js';
import { toTextStyleClassName } from '../../utils/TextStylePropsUtils.js';
import type { IconName } from '../Icon/Icon.js';
import { Icon } from '../Icon/Icon.js';

export interface InputProps {
  color?: Color;
  iconLeft?: IconName;
  placeholder?: string;
  readOnly?: boolean;
  textStyle?: TextStyle;
  type?: 'text' | 'number';
  min?: number;
  max?: number;
  step?: number | 'any';
  value?: string | number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
}

export function Input({
  color,
  iconLeft,
  placeholder,
  type,
  readOnly,
  textStyle,
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
        className={toClassName(
          'input',
          toColorClassName(color),
          textStyle && toTextStyleClassName(textStyle)
        )}
        type={type ?? 'text'}
        {...{ min, max, step, placeholder, readOnly, value, onChange, onKeyDown }}
      />
      {iconLeft ? <Icon className="is-left" icon={iconLeft} /> : null}
    </div>
  );
}
