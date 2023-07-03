import type { CSSProperties, FunctionComponent, ReactNode } from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface HoverRevealStackProps {
  children: ReactNode;
}

interface HoverRevealStackItemProps {
  style?: CSSProperties;
  forceVisible?: boolean;

  left?: boolean;
  top?: boolean;
  right?: boolean;
  bottom?: boolean;

  children: ReactNode;
}

interface HoverRevealStackComponent extends FunctionComponent<HoverRevealStackProps> {
  Item: FunctionComponent<HoverRevealStackItemProps>;
}

export const HoverRevealStack: HoverRevealStackComponent = ({
  children,
}: HoverRevealStackProps) => {
  return <div className="hover-reveal-container is-relative">{children}</div>;
};

HoverRevealStack.Item = ({
  forceVisible,
  style,
  left,
  top,
  right,
  bottom,
  children,
}: HoverRevealStackItemProps) => {
  return (
    <div
      className={toClassName(
        'item is-flex is-absolute is-inset-0',
        forceVisible && 'is-visible',
        left && 'is-justify-content-flex-start',
        top && 'is-align-items-flex-start',
        right && 'is-justify-content-flex-end',
        bottom && 'is-align-items-flex-end'
      )}
      style={style}
    >
      {children}
    </div>
  );
};
HoverRevealStack.Item.displayName = 'HoverRevealStack.Item';
