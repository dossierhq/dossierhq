import type { CSSProperties, ReactNode } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils';
import type { TextStyle } from '../../utils/TextStylePropsUtils';
import { toTextStyleClassName } from '../../utils/TextStylePropsUtils';

export interface TextProps {
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  textStyle: TextStyle;
  noBottomMargin?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function Text({
  as,
  className,
  textStyle,
  noBottomMargin,
  style,
  children,
}: TextProps): JSX.Element {
  const Element = as ?? 'p';
  return (
    <Element
      className={toClassName(toTextStyleClassName(textStyle), className, noBottomMargin && 'mb-0')}
      style={style}
    >
      {children}
    </Element>
  );
}
