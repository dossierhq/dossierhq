import type { CSSProperties, FunctionComponent, ReactNode } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils';
import type { FlexContainerProps, FlexItemProps } from '../../utils/FlexboxUtils';
import { toFlexContainerClassName, toFlexItemClassName } from '../../utils/FlexboxUtils';

export interface HoverRevealContainerProps extends FlexContainerProps {
  children: ReactNode;
}

interface HoverRevealContainerItemProps extends FlexItemProps {
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
    <div className={toClassName('hover-reveal-container', toFlexContainerClassName(props))}>
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
      className={toClassName('item', forceVisible && 'is-visible', toFlexItemClassName(props))}
      style={style}
    >
      {children}
    </div>
  );
};
HoverRevealContainer.Item.displayName = 'HoverRevealContainer.Item';
