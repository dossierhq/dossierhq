import type { CSSProperties } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils';
import type { TextStyle } from '../../utils/TextStylePropsUtils';
import { toTextStyleClassName } from '../../utils/TextStylePropsUtils';

export interface TextAreaProps {
  className?: string;
  style?: CSSProperties;
  fixedSize?: boolean;
  readOnly?: boolean;
  textStyle?: TextStyle;
  children: string;
}

export function TextArea({
  className,
  fixedSize,
  readOnly,
  style,
  textStyle,
  children,
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
    >
      {children}
    </textarea>
  );
}
