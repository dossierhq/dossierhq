import type { ReactNode } from 'react';
import React from 'react';
import type { TextStyle } from '../../utils/TextStylePropsUtils';
import { toTextStyleClassName } from '../../utils/TextStylePropsUtils';

export interface TextProps {
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  textStyle: TextStyle;
  children: ReactNode;
}

export function Text({ as, textStyle, children }: TextProps): JSX.Element {
  const Element = as ?? 'p';
  return <Element className={toTextStyleClassName(textStyle)}>{children}</Element>;
}
