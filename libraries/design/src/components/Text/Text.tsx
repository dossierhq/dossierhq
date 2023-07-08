import type { CSSProperties, ReactNode } from 'react';
import { toTextColorClassName, type Color } from '../../config/Colors.js';
import { toClassName } from '../../utils/ClassNameUtils.js';
import { toSpacingClassName, type MarginProps } from '../../utils/LayoutPropsUtils.js';
import { toTextStyleClassName, type TextStyle } from '../../utils/TextStylePropsUtils.js';

export interface TextProps extends MarginProps {
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  id?: string;
  textStyle: TextStyle;
  className?: string;
  color?: Color;
  style?: CSSProperties;
  children: ReactNode;
}

export function Text({
  as,
  id,
  className,
  textStyle,
  color,
  style,
  children,
  ...props
}: TextProps): JSX.Element {
  const Element = as ?? 'p';
  return (
    <Element
      className={toClassName(
        toTextStyleClassName(textStyle),
        className,
        toTextColorClassName(color),
        toSpacingClassName(props),
      )}
      id={id}
      style={style}
    >
      {children}
    </Element>
  );
}
