import type { CSSProperties, FunctionComponent, ReactNode } from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { FlexContainerProps, FlexItemProps } from '../../utils/FlexboxUtils.js';
import { toFlexContainerClassName, toFlexItemClassName } from '../../utils/FlexboxUtils.js';
import type { SpacingProps } from '../../utils/LayoutPropsUtils.js';
import { toSpacingClassName } from '../../utils/LayoutPropsUtils.js';

export interface RowProps extends Omit<FlexContainerProps, 'flexDirection'>, SpacingProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

interface RowItemProps extends FlexItemProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

interface RowComponent extends FunctionComponent<RowProps> {
  Item: FunctionComponent<RowItemProps>;
}

export const Row: RowComponent = ({ className, style, children, ...props }: RowProps) => {
  return (
    <div
      className={toClassName(
        className,
        toFlexContainerClassName({ ...props, flexDirection: 'row' }),
        toSpacingClassName(props)
      )}
      style={style}
    >
      {children}
    </div>
  );
};
Row.displayName = 'Row';

Row.Item = ({ className, style, children, ...props }: RowItemProps) => {
  return (
    <div className={toClassName(className, toFlexItemClassName(props))} style={style}>
      {children}
    </div>
  );
};
Row.Item.displayName = 'Row.Item';
