import type { CSSProperties, FunctionComponent, ReactNode } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { FlexContainerProps } from '../../utils/FlexboxUtils.js';
import { toFlexContainerClassName } from '../../utils/FlexboxUtils.js';
import type { SpacingProps } from '../../utils/LayoutPropsUtils.js';
import { toSpacingClassName } from '../../utils/LayoutPropsUtils.js';

export interface ColumnProps extends Omit<FlexContainerProps, 'flexDirection'>, SpacingProps {
  className?: string;
  children: ReactNode;
}

interface ColumnItemProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

interface ColumnComponent extends FunctionComponent<ColumnProps> {
  Item: FunctionComponent<ColumnItemProps>;
}

export const Column: ColumnComponent = ({ className, children, ...props }: ColumnProps) => {
  return (
    <div
      className={toClassName(
        className,
        toFlexContainerClassName({ ...props, flexDirection: 'column' }),
        toSpacingClassName(props)
      )}
    >
      {children}
    </div>
  );
};
Column.displayName = 'Column';

Column.Item = ({ className, style, children }: ColumnItemProps) => {
  return (
    <div className={toClassName(className)} style={style}>
      {children}
    </div>
  );
};
Column.Item.displayName = 'Column.Item';
