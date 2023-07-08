import type { CSSProperties, FunctionComponent, ReactNode } from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { FlexContainerProps, FlexItemProps } from '../../utils/FlexboxUtils.js';
import { toFlexContainerClassName, toFlexItemClassName } from '../../utils/FlexboxUtils.js';
import type { SpacingProps } from '../../utils/LayoutPropsUtils.js';
import { toSpacingClassName } from '../../utils/LayoutPropsUtils.js';

export interface ColumnProps extends Omit<FlexContainerProps, 'flexDirection'>, SpacingProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

interface ColumnItemProps extends FlexItemProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

interface ColumnComponent extends FunctionComponent<ColumnProps> {
  Item: FunctionComponent<ColumnItemProps>;
}

export const Column: ColumnComponent = ({ className, style, children, ...props }: ColumnProps) => {
  return (
    <div
      className={toClassName(
        className,
        toFlexContainerClassName({ ...props, flexDirection: 'column' }),
        toSpacingClassName(props),
      )}
      style={style}
    >
      {children}
    </div>
  );
};
Column.displayName = 'Column';

Column.Item = ({ className, style, children, ...props }: ColumnItemProps) => {
  return (
    <div className={toClassName(className, toFlexItemClassName(props))} style={style}>
      {children}
    </div>
  );
};
Column.Item.displayName = 'Column.Item';
