import type { CSSProperties, FunctionComponent, ReactNode } from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { FlexContainerProps, FlexItemProps } from '../../utils/FlexboxUtils.js';
import { toFlexContainerClassName, toFlexItemClassName } from '../../utils/FlexboxUtils.js';
import type { GapProps, PaddingProps } from '../../utils/LayoutPropsUtils.js';
import { toSpacingClassName } from '../../utils/LayoutPropsUtils.js';

export interface HoverRevealContainerProps extends FlexContainerProps, GapProps {
  children: ReactNode;
}

interface HoverRevealContainerItemProps extends FlexItemProps, PaddingProps {
  style?: CSSProperties;
  forceVisible?: boolean;
  children: ReactNode;
}

interface HoverRevealContainerComponent extends FunctionComponent<HoverRevealContainerProps> {
  Item: FunctionComponent<HoverRevealContainerItemProps>;
}

export const HoverRevealContainer: HoverRevealContainerComponent = ({
  children,
  ...props
}: HoverRevealContainerProps) => {
  return (
    <div
      className={toClassName(
        'hover-reveal-container',
        toFlexContainerClassName(props),
        toSpacingClassName(props)
      )}
    >
      {children}
    </div>
  );
};

HoverRevealContainer.Item = ({
  forceVisible,
  style,
  children,
  ...props
}: HoverRevealContainerItemProps) => {
  return (
    <div
      className={toClassName(
        'item',
        forceVisible && 'is-visible',
        toFlexItemClassName(props),
        toSpacingClassName(props)
      )}
      style={style}
    >
      {children}
    </div>
  );
};
HoverRevealContainer.Item.displayName = 'HoverRevealContainer.Item';
