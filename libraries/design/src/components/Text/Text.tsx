import type { ReactNode } from 'react';
import React from 'react';

const StyleClassName = {
  headline1: 'is-size-1',
  headline2: 'is-size-2',
  headline3: 'is-size-3',
  headline4: 'is-size-4',
  headline5: 'is-size-5',
  headline6: 'is-size-6',
  subtitle1: 'is-size-6 has-text-weight-bold',
  subtitle2: 'is-size-7 has-text-weight-bold',
  body1: 'is-size-6',
  body2: 'is-size-7',
  // button: '',
  // caption: '',
  // overline: '',
};

export type TextStyle = keyof typeof StyleClassName;

export interface TextProps {
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  textStyle: TextStyle;
  children: ReactNode;
}

export function Text({ as, textStyle, children }: TextProps): JSX.Element {
  const Element = as ?? 'p';
  return <Element className={StyleClassName[textStyle]}>{children}</Element>;
}
