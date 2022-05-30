import type { CSSProperties } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { TextStyle } from '../../utils/TextStylePropsUtils.js';
import { toTextStyleClassName } from '../../utils/TextStylePropsUtils.js';

export interface TextAreaProps {
  className?: string;
  style?: CSSProperties;
  fixedSize?: boolean;
  readOnly?: boolean;
  textStyle?: TextStyle;
  defaultValue?: string;
}

export function TextArea({
  className,
  fixedSize,
  readOnly,
  style,
  textStyle,
  defaultValue,
}: TextAreaProps) {
  return (
    <textarea
      className={toClassName(
        'textarea',
        fixedSize && 'has-fixed-size',
        textStyle && toTextStyleClassName(textStyle),
        className
      )}
      readOnly={readOnly}
      style={style}
      defaultValue={defaultValue}
    />
  );
}
